# Database Access & Logs Guide

This guide covers everything you need to access the database and view all logs (both the **`audit_logs` table** in the database and **database engine / service logs**) for **JurifyLaw**.

---

## 1. Database Connection Credentials

Depending on your setup, use the relevant credentials:

### PostgreSQL (Docker / Production)
* **Host**: `localhost` (or `postgres` inside Docker network)
* **Port**: `5432`
* **Database Name**: `jurifylaw`
* **Username**: `jurifylaw`
* **Password**: `jurifylaw`
* **Connection URL**:
  ```text
  postgresql+psycopg://jurifylaw:jurifylaw@localhost:5432/jurifylaw
  ```

### SQLite (Local Dev fallback)
* **File Path**: `backend/jurifylaw.db`
* **Connection URL**:
  ```text
  sqlite:///./jurifylaw.db
  ```

---

## 2. How to Access the Database

### Method A: Via Docker CLI (Recommended for PostgreSQL)
Run `psql` directly inside the running PostgreSQL container:
```bash
docker compose exec postgres psql -U jurifylaw -d jurifylaw
```
*(Or without compose: `docker exec -it <container_id_or_name> psql -U jurifylaw -d jurifylaw`)*

### Method B: Via Local `psql` CLI (Host Machine)
```bash
PGPASSWORD=jurifylaw psql -h localhost -p 5432 -U jurifylaw -d jurifylaw
```

### Method C: Via SQLite CLI (If using SQLite)
```bash
sqlite3 backend/jurifylaw.db
```

### Method D: Via GUI Clients (DBeaver, pgAdmin, TablePlus, VS Code extension)
* **Host**: `127.0.0.1` / `localhost`
* **Port**: `5432`
* **Database**: `jurifylaw`
* **Username**: `jurifylaw`
* **Password**: `jurifylaw`

---

## 3. Useful Database Navigation Commands

Once inside `psql`:

```sql
-- List all tables
\dt

-- Describe the audit_logs table schema
\d audit_logs

-- Show active database connections
SELECT pid, usename, client_addr, state, query FROM pg_stat_activity WHERE datname = 'jurifylaw';

-- Exit psql
\q
```

---

## 4. How to View Audit Logs in the Database

JurifyLaw stores application events and user actions in the **`audit_logs`** table.

### View all audit logs (most recent first):
```sql
SELECT 
    id,
    created_at,
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address
FROM audit_logs
ORDER BY created_at DESC;
```

### View latest 20 logs with formatted output:
```sql
SELECT 
    id,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS timestamp,
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Filter logs by user:
```sql
SELECT * FROM audit_logs 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### Filter logs by action / resource:
```sql
SELECT * FROM audit_logs 
WHERE action ILIKE '%DOCUMENT%' 
   OR resource_type = 'document' 
ORDER BY created_at DESC;
```

### Count logs grouped by action type:
```sql
SELECT action, COUNT(*) AS count
FROM audit_logs
GROUP BY action
ORDER BY count DESC;
```

---

---

## 5. Specific Queries for Users, Passwords & File Uploads

### A. User Accounts & Hashed Passwords
> **Security Note:** In JurifyLaw, passwords are cryptographically hashed using **bcrypt** in `users.hashed_password` (plain-text passwords are never stored directly in production systems for security).

```sql
-- View all registered users and account status
SELECT 
    id,
    email,
    full_name,
    is_active,
    hashed_password,
    created_at
FROM users
ORDER BY created_at DESC;
```

---

### B. Track User Logins & Auth Activity
Every login, registration, and logout is recorded in `audit_logs`:

```sql
-- See all user login events with User details, IP address, and timestamp
SELECT 
    a.id AS log_id,
    a.created_at AS login_time,
    u.id AS user_id,
    u.email,
    u.full_name,
    a.action,
    a.ip_address
FROM audit_logs a
JOIN users u ON a.user_id = u.id
WHERE a.action IN ('auth.login', 'auth.register', 'auth.logout')
ORDER BY a.created_at DESC;
```

---

### C. Track All File Uploads (Who uploaded What & When)
File uploads are recorded in both `documents` table and `audit_logs`:

```sql
-- View all uploaded files with the Uploader's Email, File Size, and Status
SELECT 
    d.id AS document_id,
    d.created_at AS upload_time,
    u.id AS user_id,
    u.email AS uploaded_by_email,
    u.full_name AS uploaded_by_name,
    d.original_filename,
    d.file_type,
    ROUND(d.file_size / 1024.0 / 1024.0, 2) AS file_size_mb,
    d.status,
    d.storage_path
FROM documents d
JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC;
```

---

### D. Complete Activity History for a Specific User
To get everything a specific user did (Logins, Uploads, Analysis):

```sql
SELECT 
    a.id,
    a.created_at,
    u.email,
    a.action,
    a.resource_type,
    a.resource_id,
    a.ip_address
FROM audit_logs a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.email = 'user@example.com'  -- Replace with desired email or u.id = 1
ORDER BY a.created_at DESC;
```

---

## 6. One-Liner Commands to Export or View Logs

### Stream latest 15 logs directly to terminal:
```bash
docker compose exec postgres psql -U jurifylaw -d jurifylaw -c "SELECT id, created_at, action, resource_type, ip_address FROM audit_logs ORDER BY created_at DESC LIMIT 15;"
```

### Export database audit logs to CSV:
```bash
docker compose exec postgres psql -U jurifylaw -d jurifylaw -c "\copy (SELECT * FROM audit_logs ORDER BY created_at DESC) TO STDOUT WITH CSV HEADER" > audit_logs_export.csv
```

---

## 6. How to View Database Server & Application Logs

### View PostgreSQL server container logs:
```bash
# Follow live logs
docker compose logs -f postgres

# View last 100 log lines
docker compose logs --tail=100 postgres
```

### View Backend API logs (FastAPI requests & DB transactions):
```bash
# Follow live backend logs
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend
```

### View all services logs combined:
```bash
docker compose logs -f
```

---

## 7. Python Quick Script to Read DB Logs

You can run this python script directly inside the `backend` environment:

```bash
cd backend && python -c "
from app.core.database import SessionLocal
from app.models.audit import AuditLog
with SessionLocal() as db:
    for log in db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all():
        print(f'[{log.created_at}] Action: {log.action} | Resource: {log.resource_type} (ID: {log.resource_id}) | User ID: {log.user_id}')
"
```
