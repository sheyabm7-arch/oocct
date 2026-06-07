from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import bcrypt

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/oct_platform"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="patient")  # patient / doctor
    specialty = Column(String, nullable=True)
    reports_sent = relationship("Report", foreign_keys="Report.patient_id", back_populates="patient")
    reports_received = relationship("Report", foreign_keys="Report.doctor_id", back_populates="doctor")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    status = Column(String, default="pending")
    date = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    patient = relationship("User", foreign_keys=[patient_id], back_populates="reports_sent")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="reports_received")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")


Base.metadata.create_all(bind=engine)


# ─── Schemas ──────────────────────────────────────────────

class RegisterSchema(BaseModel):
    name: str
    email: str
    password: str
    role: str = "patient"
    specialty: Optional[str] = None

class LoginSchema(BaseModel):
    email: str
    password: str

class ReportSchema(BaseModel):
    type: str
    summary: str
    patient_id: int
    doctor_id: int

class MessageSchema(BaseModel):
    content: str
    sender_id: int
    receiver_id: int


# ─── DB Dependency ────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Auth ─────────────────────────────────────────────────

@app.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user = User(name=data.name, email=data.email, password=hashed, role=data.role, specialty=data.specialty)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not bcrypt.checkpw(data.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "specialty": user.specialty}


# ─── Users ────────────────────────────────────────────────

@app.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == "doctor").all()
    return [{"id": d.id, "name": d.name, "specialty": d.specialty} for d in doctors]


# ─── Reports ──────────────────────────────────────────────

@app.post("/reports")
def create_report(data: ReportSchema, db: Session = Depends(get_db)):
    report = Report(type=data.type, summary=data.summary, patient_id=data.patient_id, doctor_id=data.doctor_id)
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": report.id, "type": report.type, "status": report.status}

@app.get("/reports/patient/{patient_id}")
def get_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.date.desc()).all()
    return [
        {
            "id": r.id,
            "type": r.type,
            "summary": r.summary,
            "status": r.status,
            "date": r.date.strftime("%b %d, %Y"),
            "time": r.date.strftime("%I:%M %p"),
            "doctor": r.doctor.name if r.doctor else "",
            "specialty": r.doctor.specialty if r.doctor else "",
        }
        for r in reports
    ]

@app.get("/reports/doctor/{doctor_id}")
def get_doctor_reports(doctor_id: int, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.doctor_id == doctor_id).order_by(Report.date.desc()).all()
    return [
        {
            "id": r.id,
            "type": r.type,
            "summary": r.summary,
            "status": r.status,
            "date": r.date.strftime("%b %d, %Y"),
            "patient": r.patient.name if r.patient else "",
        }
        for r in reports
    ]

@app.patch("/reports/{report_id}/status")
def update_report_status(report_id: int, status: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = status
    db.commit()
    return {"id": report.id, "status": report.status}


# ─── Messages ─────────────────────────────────────────────

@app.post("/messages")
def send_message(data: MessageSchema, db: Session = Depends(get_db)):
    msg = Message(content=data.content, sender_id=data.sender_id, receiver_id=data.receiver_id)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "content": msg.content, "date": msg.date}

@app.get("/messages/{user_id}/{other_id}")
def get_messages(user_id: int, other_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
        ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
    ).order_by(Message.date).all()
    return [
        {
            "id": m.id,
            "content": m.content,
            "sender_id": m.sender_id,
            "date": m.date.strftime("%I:%M %p"),
        }
        for m in msgs
    ]

@app.get("/messages/inbox/{user_id}")
def get_inbox(user_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(Message.receiver_id == user_id).order_by(Message.date.desc()).all()
    return [
        {
            "id": m.id,
            "content": m.content,
            "sender": m.sender.name if m.sender else "",
            "date": m.date.strftime("%b %d, %Y %I:%M %p"),
        }
        for m in msgs
    ]


@app.get("/")
def root():
    return {"message": "OCT Backend is running"}
