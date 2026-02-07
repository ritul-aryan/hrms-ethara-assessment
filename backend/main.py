from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# --- DATABASE SETUP ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./hrms.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    department = Column(String)
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    date = Column(String)
    status = Column(String)
    timestamp = Column(String) # Tracks exact time of action
    employee = relationship("Employee", back_populates="attendance_records")

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class EmployeeCreate(BaseModel):
    name: str; email: str; department: str

class AttendanceCreate(BaseModel):
    employee_id: int; date: str; status: str

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "HRMS Lite (Python) is Running!"}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # 1. Total Count
    total_employees = db.query(Employee).count()
    
    # 2. Smart Date Logic (Fixes Timezone Bug)
    # We find the date of the most recent attendance record.
    # This ensures the dashboard matches the user's activity, regardless of server timezone.
    latest_record = db.query(Attendance).order_by(desc(Attendance.id)).first()
    
    if latest_record:
        target_date = latest_record.date
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")
    
    present_count = db.query(Attendance).filter(Attendance.date == target_date, Attendance.status == "Present").count()
    absent_count = db.query(Attendance).filter(Attendance.date == target_date, Attendance.status == "Absent").count()

    # 3. Recent Activity (Last 5 actions)
    recent_activity = db.query(Attendance).order_by(desc(Attendance.id)).limit(5).all()
    activity_log = []
    for act in recent_activity:
        emp = db.query(Employee).filter(Employee.id == act.employee_id).first()
        if emp:
            activity_log.append({
                "name": emp.name,
                "status": act.status,
                "time": act.timestamp or "Just now"
            })

    # 4. Department Distribution
    depts = db.query(Employee.department).all()
    dept_counts = {}
    for d in depts:
        dept_counts[d[0]] = dept_counts.get(d[0], 0) + 1
    
    return {
        "total_employees": total_employees,
        "present_today": present_count,
        "absent_today": absent_count,
        "recent_activity": activity_log,
        "department_stats": [{"name": k, "count": v} for k, v in dept_counts.items()]
    }

@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(desc(Employee.id)).all()

@app.post("/employees")
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.email == emp.email).first():
        raise HTTPException(status_code=400, detail="Email exists")
    new_emp = Employee(name=emp.name, email=emp.email, department=emp.department)
    db.add(new_emp); db.commit(); db.refresh(new_emp)
    return new_emp

@app.delete("/employees/{id}")
def delete_employee(id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if emp: db.delete(emp); db.commit()
    return {"msg": "Deleted"}

@app.post("/attendance")
def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db)):
    # Check if already marked for this date
    existing = db.query(Attendance).filter(Attendance.employee_id == att.employee_id, Attendance.date == att.date).first()
    now_time = datetime.now().strftime("%H:%M")
    
    if existing:
        existing.status = att.status
        existing.timestamp = now_time
    else:
        new_att = Attendance(employee_id=att.employee_id, date=att.date, status=att.status, timestamp=now_time)
        db.add(new_att)
    db.commit()
    return {"msg": "Marked"}

@app.get("/attendance/{id}")
def get_history(id: int, db: Session = Depends(get_db)):
    return db.query(Attendance).filter(Attendance.employee_id == id).order_by(desc(Attendance.date)).all()
