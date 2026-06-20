from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
import os
import uuid
from datetime import datetime
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="DemandPortal API",
    version="1.0.0",
    description="Self-Service Infrastructure Demand Portal"
)

# ── Prometheus metrics ─────────────────────────
Instrumentator().instrument(app).expose(app)

# ── CORS ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/demandportal")

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS requests (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            resource_type VARCHAR(50) NOT NULL,
            requester_name VARCHAR(100) NOT NULL,
            requester_email VARCHAR(100) NOT NULL,
            environment VARCHAR(20) DEFAULT 'production',
            priority VARCHAR(10) DEFAULT 'medium',
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            approved_by VARCHAR(100),
            notes TEXT
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

@app.on_event("startup")
def startup():
    init_db()

class RequestCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    resource_type: str
    requester_name: str
    requester_email: str
    environment: Optional[str] = "production"
    priority: Optional[str] = "medium"

class RequestUpdate(BaseModel):
    status: str
    approved_by: Optional[str] = ""
    notes: Optional[str] = ""

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "version": "1.0.0"}

@app.post("/api/requests", status_code=201)
def create_request(req: RequestCreate, db=Depends(get_db)):
    cur = db.cursor()
    req_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO requests (id, title, description, resource_type, requester_name, requester_email, environment, priority)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (req_id, req.title, req.description, req.resource_type,
          req.requester_name, req.requester_email, req.environment, req.priority))
    db.commit()
    cur.close()
    return {"id": req_id, "message": "Request submitted", "status": "pending"}

@app.get("/api/requests")
def list_requests(status: Optional[str] = None, db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if status:
        cur.execute("SELECT * FROM requests WHERE status = %s ORDER BY created_at DESC", (status,))
    else:
        cur.execute("SELECT * FROM requests ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    return [dict(r) for r in rows]

@app.get("/api/requests/{req_id}")
def get_request(req_id: str, db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM requests WHERE id = %s", (req_id,))
    row = cur.fetchone()
    cur.close()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    return dict(row)

@app.put("/api/requests/{req_id}")
def update_request(req_id: str, update: RequestUpdate, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        UPDATE requests SET status=%s, approved_by=%s, notes=%s, updated_at=NOW()
        WHERE id=%s
    """, (update.status, update.approved_by, update.notes, req_id))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    db.commit()
    cur.close()
    return {"message": f"Request {update.status}"}

@app.get("/api/stats")
def get_stats(db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
        FROM requests
    """)
    row = cur.fetchone()
    cur.close()
    return dict(row)
