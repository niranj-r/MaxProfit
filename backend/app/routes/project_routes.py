### app/routes/project_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app.models.project import Project
from app.models.assignments import ProjectAssignment
from app.utils.helpers import log_activity
from app import db

proj_bp = Blueprint("project", __name__, url_prefix="/api/projects")

@proj_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    data = request.json
    project = Project(
        name=data["name"],
        departmentId=data["departmentId"],
        startDate=datetime.strptime(data["startDate"], "%Y-%m-%d"),
        endDate=datetime.strptime(data["endDate"], "%Y-%m-%d"),
        budget=float(data["budget"])
    )
    db.session.add(project)
    db.session.commit()
    log_activity("Project", project.name, "created")
    return jsonify({"message": "Project created"}), 201

@proj_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    projects = Project.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "departmentId": p.departmentId,
        "startDate": p.startDate.strftime('%Y-%m-%d'),
        "endDate": p.endDate.strftime('%Y-%m-%d'),
        "budget": p.budget,
        "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
    } for p in projects])

@proj_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    data = request.json
    project = Project.query.get_or_404(project_id)
    project.name = data.get('name', project.name)
    project.departmentId = data.get('departmentId', project.departmentId)
    project.startDate = datetime.strptime(data['startDate'], '%Y-%m-%d')
    project.endDate = datetime.strptime(data['endDate'], '%Y-%m-%d')
    project.budget = float(data['budget'])
    db.session.commit()
    log_activity("Project", project.name, "updated")
    return jsonify({
        'id': project.id,
        'name': project.name,
        'departmentId': project.departmentId,
        'startDate': project.startDate.strftime('%Y-%m-%d'),
        'endDate': project.endDate.strftime('%Y-%m-%d'),
        'budget': project.budget
    }), 200

@proj_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    proj = Project.query.get(project_id)
    if not proj:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(proj)
    db.session.commit()
    log_activity("Project", proj.name, "deleted")
    return jsonify({"message": "Project deleted"}), 200

@proj_bp.route('/<int:project_id>/total-cost', methods=['GET'])
@jwt_required()
def get_project_total_cost(project_id):
    total_cost = db.session.query(db.func.sum(ProjectAssignment.cost))\
        .filter_by(project_id=project_id).scalar()
    return jsonify({"totalCost": float(total_cost or 0)})

@proj_bp.route('/upcoming-deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    today = datetime.today().date()
    upcoming = (
        Project.query
        .filter(Project.endDate >= today)
        .order_by(Project.endDate)
        .limit(5)
        .all()
    )
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "endDate": p.endDate.strftime('%Y-%m-%d')
    } for p in upcoming])

@proj_bp.route('/project-budgets', methods=['GET'])
@jwt_required()
def get_project_budgets():
    projects = Project.query.with_entities(Project.name, Project.budget).all()
    return jsonify([{ "name": name, "budget": budget } for name, budget in projects])