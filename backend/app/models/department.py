### app/models/department.py
from app import db
from datetime import datetime

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    did = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(100))
    oid = db.Column(db.String(20))
    managerId = db.Column(db.String(100))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)
