"""
Database Seed Data Script
Populates the database with initial test data
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import sys
import os

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app.models.user import User, UserRole
from backend.app.models.chat import ChatSession, ChatMessage
from backend.app.models.complaint import Complaint, ComplaintType, ComplaintStatus
from backend.app.models.feedback import Feedback, FeedbackCategory, FeedbackStatus
from backend.app.models.document import LegalDocument, UploadedDocument, DocumentType
from backend.app.auth.jwt_handler import hash_password
from backend.app.config.settings import DATABASE_URL


async def seed_database():
    """Seed the database with initial data."""
    engine = create_async_engine(DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession)
    
    async with session_factory() as session:
        # Create admin user
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@leagleease.com",
            username="admin",
            full_name="LeagleEase Admin",
            password_hash=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            is_superuser=True,
            is_verified=True,
        )
        session.add(admin_user)
        
        # Create citizen user
        citizen_user = User(
            id=uuid.uuid4(),
            email="citizen@example.com",
            username="citizen1",
            full_name="Rahul Sharma",
            password_hash=hash_password("Citizen@123"),
            role=UserRole.CITIZEN,
            is_verified=True,
        )
        session.add(citizen_user)
        
        # Create lawyer user
        lawyer_user = User(
            id=uuid.uuid4(),
            email="lawyer@example.com",
            username="lawyer1",
            full_name="Priya Patel",
            password_hash=hash_password("Lawyer@123"),
            role=UserRole.LAWYER,
            is_verified=True,
            bar_council_number="DEL/1234/2020",
        )
        session.add(lawyer_user)
        
        await session.flush()
        
        # Create sample legal documents
        legal_docs = [
            LegalDocument(
                title="Bharatiya Nyaya Sanhita - Section 302",
                category="BNS",
                sub_category="IPC Equivalent",
                section_number="302",
                content="Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
                summary="Section 302 deals with punishment for murder under Indian law.",
                source="Bharatiya Nyaya Sanhita, 2023",
            ),
            LegalDocument(
                title="Information Technology Act - Section 66",
                category="IT_ACT",
                sub_category="Cyber Crimes",
                section_number="66",
                content="Computer related offences. If any person, dishonestly or fraudulently, does any act referred to in section 43, he shall be punishable with imprisonment for a term which may extend to three years or with fine which may extend to five lakh rupees or with both.",
                summary="Section 66 covers computer-related offences under IT Act.",
                source="Information Technology Act, 2000",
            ),
            LegalDocument(
                title="Consumer Protection Act - Section 2(7)",
                category="Consumer_Protection",
                sub_category="Definitions",
                section_number="2(7)",
                content="'consumer' means any person who buys any goods for a consideration which has been paid or promised or partly paid and partly promised, or under any system of deferred payment and includes any user of such goods other than the person who buys such goods for consideration paid or promised.",
                summary="Definition of consumer under the Consumer Protection Act.",
                source="Consumer Protection Act, 2019",
            ),
            LegalDocument(
                title="BNSS - Section 173",
                category="BNSS",
                sub_category="Criminal Procedure",
                section_number="173",
                content="Report of police officer on completion of investigation. Every investigation under this Chapter shall be completed without unnecessary delay.",
                summary="Section 173 deals with police investigation reports.",
                source="Bharatiya Nagarik Suraksha Sanhita, 2023",
            ),
        ]
        
        for doc in legal_docs:
            session.add(doc)
        
        await session.commit()
        print("Database seeded successfully!")
        
        return {
            "admin_id": str(admin_user.id),
            "citizen_id": str(citizen_user.id),
            "lawyer_id": str(lawyer_user.id),
        }


if __name__ == "__main__":
    result = asyncio.run(seed_database())
    print(f"Created users: {result}")
