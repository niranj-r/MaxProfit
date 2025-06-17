### app/routes/assignee_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import and_
from app.models.user import User
from app.models.project import Project
from app.models.assignments import ProjectAssignment
from app.models.association import project_assignees
from app import db

assignee_bp = Blueprint("assignee", __name__, url_prefix="/api/projects")

@assignee_bp.route('/<int:project_id>/assignees', methods=['GET'])
@jwt_required()
def get_assignees(project_id):
    assignments = (
        db.session.query(ProjectAssignment, User)
        .join(User, ProjectAssignment.user_id == User.id)
        .filter(ProjectAssignment.project_id == project_id)
        .all()
    )
    return jsonify([{
        'eid': user.eid,
        'fname': user.fname,
        'lname': user.lname,
        'email': user.email,
        'role': user.role,
        'cost': pa.cost,
    } for pa, user in assignments])

@assignee_bp.route('/<int:project_id>/assignees', methods=['POST'])
@jwt_required()
def add_assignee(project_id):
    data = request.json
    eid = data.get("eid")
    role = data.get("role", "").strip()

    if not eid or not role:
        return jsonify({"error": "EID and role required"}), 400

    project = db.session.get(Project, project_id)
    user = User.query.filter_by(eid=eid).first()
    if not project or not user:
        return jsonify({"error": "Project or user not found"}), 404

    exists = db.session.execute(
        project_assignees.select().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    ).first()
    if exists:
        return jsonify({"error": "Employee already assigned"}), 409

    if role == "Project Manager":
        pm_exists = db.session.execute(
            project_assignees.select().where(
                and_(
                    project_assignees.c.project_id == project_id,
                    project_assignees.c.role == "Project Manager"
                )
            )
        ).first()
        if pm_exists:
            return jsonify({"error": "This project already has a Project Manager"}), 409

    db.session.execute(
        project_assignees.insert().values({
            "project_id": project_id,
            "user_id": user.id,
            "role": role
        })
    )
    db.session.commit()
    return jsonify({"message": "Assignee added with role"}), 200

@assignee_bp.route('/<int:project_id>/assignees/<eid>', methods=['DELETE'])
@jwt_required()
def remove_assignee(project_id, eid):
    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    result = db.session.execute(
        project_assignees.delete().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    )
    if result.rowcount == 0:
        return jsonify({"error": "Assignee not found in project"}), 404

    db.session.commit()
    return jsonify({"message": "Assignee removed"}), 200
