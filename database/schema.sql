-- ========================================================
-- LeagleEase Database Schema
-- AI-Powered Legal Guidance & Complaint Drafting Assistant
-- PostgreSQL Schema
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- USERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('admin', 'citizen', 'lawyer', 'police')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    avatar_url VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    date_of_birth TIMESTAMP WITH TIME ZONE,
    aadhaar_number VARCHAR(12),
    bar_council_number VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en',
    dark_mode BOOLEAN DEFAULT FALSE,
    total_chats INTEGER DEFAULT 0,
    total_complaints INTEGER DEFAULT 0,
    total_queries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ========================================================
-- CHAT SESSIONS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat',
    context JSONB DEFAULT '{}',
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat_sessions
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_category ON chat_sessions(category);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_sessions_is_active ON chat_sessions(is_active);

-- ========================================================
-- CHAT MESSAGES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_html TEXT,
    model_used VARCHAR(100),
    sources JSONB DEFAULT '[]',
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    tokens_used INTEGER,
    metadata_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- ========================================================
-- COMPLAINTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    complaint_type VARCHAR(20) NOT NULL CHECK (complaint_type IN ('police', 'cyber', 'consumer', 'women', 'property', 'fraud', 'missing_person', 'custom')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'downloaded', 'submitted', 'archived')),
    complaint_text TEXT,
    complaint_text_en TEXT,
    complaint_text_local TEXT,
    complainant_name VARCHAR(255),
    complainant_address TEXT,
    complainant_phone VARCHAR(20),
    complainant_email VARCHAR(255),
    incident_date TIMESTAMP WITH TIME ZONE,
    incident_location TEXT,
    incident_summary TEXT,
    timeline JSONB DEFAULT '[]',
    accused_name VARCHAR(255),
    accused_address TEXT,
    accused_details TEXT,
    evidence_list JSONB DEFAULT '[]',
    witness_list JSONB DEFAULT '[]',
    legal_sections JSONB DEFAULT '[]',
    legal_references JSONB DEFAULT '[]',
    police_station_name VARCHAR(255),
    police_station_address TEXT,
    police_jurisdiction VARCHAR(255),
    pdf_path VARCHAR(500),
    docx_path VARCHAR(500),
    language VARCHAR(10) DEFAULT 'en',
    metadata_json JSONB DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT TRUE,
    generation_prompt TEXT,
    confidence_score INTEGER,
    reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for complaints
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_type ON complaints(complaint_type);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);

-- ========================================================
-- FEEDBACK TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(20) DEFAULT 'general' CHECK (category IN ('general', 'bug', 'feature', 'incorrect_answer', 'suggestion', 'complaint', 'other')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    page_url VARCHAR(500),
    chat_session_id UUID,
    screenshot_url VARCHAR(500),
    admin_response TEXT,
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    user_agent VARCHAR(500),
    browser VARCHAR(100),
    os VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feedback
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- ========================================================
-- UPLOADED DOCUMENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(20) DEFAULT 'other' CHECK (document_type IN ('image', 'pdf', 'document', 'voice', 'video', 'evidence', 'legal_doc', 'other')),
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_text TEXT,
    ocr_confidence INTEGER,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    evidence_description TEXT,
    evidence_metadata JSONB DEFAULT '{}',
    embedded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for uploaded_documents
CREATE INDEX idx_uploaded_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX idx_uploaded_documents_complaint_id ON uploaded_documents(complaint_id);
CREATE INDEX idx_uploaded_documents_type ON uploaded_documents(document_type);
CREATE INDEX idx_uploaded_documents_created_at ON uploaded_documents(created_at DESC);

-- ========================================================
-- LEGAL DOCUMENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    content TEXT NOT NULL,
    summary TEXT,
    section_number VARCHAR(50),
    source VARCHAR(500),
    source_url VARCHAR(1000),
    page_number INTEGER,
    file_path VARCHAR(500),
    language VARCHAR(10) DEFAULT 'en',
    tags JSONB DEFAULT '[]',
    metadata_json JSONB DEFAULT '{}',
    embedded BOOLEAN DEFAULT FALSE,
    embedding_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for legal_documents
CREATE INDEX idx_legal_documents_category ON legal_documents(category);
CREATE INDEX idx_legal_documents_section_number ON legal_documents(section_number);
CREATE INDEX idx_legal_documents_embedded ON legal_documents(embedded);
CREATE INDEX idx_legal_documents_created_at ON legal_documents(created_at DESC);

-- ========================================================
-- EMBEDDINGS METADATA TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS embeddings_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(100) NOT NULL,
    document_title VARCHAR(500),
    document_category VARCHAR(100),
    chunk_id VARCHAR(100) NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_size INTEGER NOT NULL,
    embedding_model VARCHAR(100) NOT NULL,
    embedding_dimension INTEGER NOT NULL,
    embedding_id VARCHAR(100),
    source VARCHAR(500),
    section_number VARCHAR(50),
    page_number INTEGER,
    similarity_score DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for embeddings_metadata
CREATE INDEX idx_embeddings_metadata_document_id ON embeddings_metadata(document_id);
CREATE INDEX idx_embeddings_metadata_chunk_id ON embeddings_metadata(chunk_id);
CREATE INDEX idx_embeddings_metadata_category ON embeddings_metadata(document_category);
CREATE INDEX idx_embeddings_metadata_is_active ON embeddings_metadata(is_active);

-- ========================================================
-- SESSIONS TABLE (for token blacklisting)
-- ========================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    is_revoked BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_id ON sessions(token_id);
CREATE INDEX idx_sessions_is_revoked ON sessions(is_revoked);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ========================================================
-- TRIGGER: Auto-update updated_at
-- ========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_uploaded_documents_updated_at
    BEFORE UPDATE ON uploaded_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_legal_documents_updated_at
    BEFORE UPDATE ON legal_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_embeddings_metadata_updated_at
    BEFORE UPDATE ON embeddings_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- FULL TEXT SEARCH
-- ========================================================
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION update_legal_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.summary, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_legal_documents_search_vector
    BEFORE INSERT OR UPDATE ON legal_documents
    FOR EACH ROW EXECUTE FUNCTION update_legal_documents_search_vector();

CREATE INDEX idx_legal_documents_search ON legal_documents USING GIN(search_vector);

-- ========================================================
-- VIEWS
-- ========================================================

-- User summary view
CREATE OR REPLACE VIEW user_summary AS
SELECT
    id,
    email,
    username,
    full_name,
    role,
    is_active,
    is_verified,
    preferred_language,
    total_chats,
    total_complaints,
    created_at,
    last_login_at
FROM users;

-- Complaint stats view
CREATE OR REPLACE VIEW complaint_stats AS
SELECT
    complaint_type,
    status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM complaints
GROUP BY complaint_type, status;

-- Daily usage view
CREATE OR REPLACE VIEW daily_usage AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_messages,
    COUNT(DISTINCT session_id) as total_sessions
FROM chat_messages
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ========================================================
-- SEED DATA: Admin User
-- ========================================================
-- Password: Admin@123 (bcrypt hash)
INSERT INTO users (email, username, full_name, password_hash, role, is_superuser, is_verified)
VALUES ('admin@leagleease.com', 'admin', 'LeagleEase Admin', '$2b$12$4vFGDYVXXmo9cmSH/qhGlOfCS6DHyz6B6pGjAx4gqMqDSI9ik/mmq', 'admin', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;
