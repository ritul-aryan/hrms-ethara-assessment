from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta

# --- DATABASE SETUP ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./hrms.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    emp_code = Column(String, unique=True, index=True)
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
    timestamp = Column(String) 
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

class EmployeeSchema(BaseModel):
    emp_code: str; name: str; email: str; department: str

class AttendanceCreate(BaseModel):
    employee_id: int; date: str; status: str

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "HRMS Lite is Running!"}

@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    if db.query(Employee).count() > 0:
        return {"msg": "Database already has data"}
    
    employees = [
        Employee(emp_code="EMP001", name="Ritul Aryan", email="ritul@ethara.ai", department="Engineering"),
        Employee(emp_code="EMP002", name="Shruti Bansal", email="shruti@ethara.ai", department="HR"),
        Employee(emp_code="EMP003", name="Rahul Sharma", email="rahul@ethara.ai", department="Sales"),
        Employee(emp_code="EMP004", name="Parna Ray", email="parna@krmu.edu.in", department="Management")
    ]
    db.add_all(employees)
    db.commit()

    # Fake History (Last 3 Days)
    db_employees = db.query(Employee).all()
    today = datetime.now()
    for emp in db_employees:
        for i in range(3):
            past_date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            status = "Present"
            # Randomize absent for demo
            if emp.department == "Sales" and i == 1: status = "Absent"
            db.add(Attendance(employee_id=emp.id, date=past_date, status=status, timestamp="09:00"))
    db.commit()
    return {"msg": "Demo Data Restored!"}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    today = datetime.now().strftime("%Y-%m-%d")
    
    present_today = db.query(Attendance).filter(Attendance.date == today, Attendance.status == "Present").count()
    absent_today = db.query(Attendance).filter(Attendance.date == today, Attendance.status == "Absent").count()

    recent_activity = db.query(Attendance).order_by(desc(Attendance.id)).limit(50).all()
    activity_log = []
    for act in recent_activity:
        emp = db.query(Employee).filter(Employee.id == act.employee_id).first()
        if emp:
            activity_log.append({
                "name": emp.name,
                "department": emp.department,
                "status": act.status,
                "time": act.timestamp,
                "date": act.date
            })

    depts = db.query(Employee.department).all()
    dept_counts = {}
    for d in depts:
        dept_counts[d[0]] = dept_counts.get(d[0], 0) + 1
    
    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "absent_today": absent_today,
        "recent_activity": activity_log,
        "department_stats": [{"name": k, "count": v} for k, v in dept_counts.items()]
    }

@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(desc(Employee.id)).all()
    result = []
    for emp in employees:
        total_present = db.query(Attendance).filter(Attendance.employee_id == emp.id, Attendance.status == "Present").count()
        total_days = db.query(Attendance).filter(Attendance.employee_id == emp.id).count()
        rate = int((total_present / total_days) * 100) if total_days > 0 else 0
            
        result.append({
            "id": emp.id,
            "emp_code": emp.emp_code,
            "name": emp.name,
            "email": emp.email,
            "department": emp.department,
            "attendance_rate": rate,
            "total_present": total_present
        })
    return result

@app.post("/employees")
def create_employee(emp: EmployeeSchema, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.email == emp.email).first():
        raise HTTPException(status_code=400, detail="Email exists")
    if db.query(Employee).filter(Employee.emp_code == emp.emp_code).first():
        raise HTTPException(status_code=400, detail="Employee ID exists")
    new_emp = Employee(emp_code=emp.emp_code, name=emp.name, email=emp.email, department=emp.department)
    db.add(new_emp); db.commit(); db.refresh(new_emp)
    return new_emp

# --- REAL EDIT ENDPOINT (PUT) ---
@app.put("/employees/{id}")
def update_employee(id: int, emp_update: EmployeeSchema, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check duplicates only if email changes
    if emp.email != emp_update.email and db.query(Employee).filter(Employee.email == emp_update.email).first():
        raise HTTPException(status_code=400, detail="Email already taken")
    
    emp.name = emp_update.name
    emp.email = emp_update.email
    emp.department = emp_update.department
    emp.emp_code = emp_update.emp_code
    
    db.commit()
    db.refresh(emp)
    return emp

@app.delete("/employees/{id}")
def delete_employee(id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if emp: db.delete(emp); db.commit()
    return {"msg": "Deleted"}

@app.post("/attendance")
def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db)):
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
