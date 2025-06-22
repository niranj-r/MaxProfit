from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    working_hours = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    

class Project(db.Model):
    __tablename__ = 'project'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    departmentId = db.Column(db.Integer)
    startDate = db.Column(db.DateTime)
    endDate = db.Column(db.DateTime)
    budget = db.Column(db.Float)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectAssignment(db.Model):
    __tablename__ = 'project_assignment'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer)
    user_id = db.Column(db.Integer)
    allocated_percentage = db.Column(db.Float)
    allocated_hours = db.Column(db.Float)
    billing_rate = db.Column(db.Float)
    cost = db.Column(db.Float)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
