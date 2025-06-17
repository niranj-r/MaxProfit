### app/models/assignments.py
from app import db
from datetime import datetime

class ProjectAssignment(db.Model):
    __tablename__ = 'project_assignment'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    allocated_percentage = db.Column(db.Float)
    allocated_hours = db.Column(db.Float)
    billing_rate = db.Column(db.Float)
    cost = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)