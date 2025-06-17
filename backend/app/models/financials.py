### app/models/financials.py
from app import db
from datetime import datetime

class EmployeeFinancials(db.Model):
    __tablename__ = 'employee_financials'

    id = db.Column(db.Integer, primary_key=True)
    eid = db.Column(db.String(20), db.ForeignKey('user.eid'), unique=True, nullable=False)
    salary = db.Column(db.Float, nullable=True)
    infrastructure = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)