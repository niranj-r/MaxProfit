### app/models/project.py
from app import db
from datetime import datetime

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    departmentId = db.Column(db.String(20))
    startDate = db.Column(db.Date)
    endDate = db.Column(db.Date)
    budget = db.Column(db.Float)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)