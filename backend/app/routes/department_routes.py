### app/routes/department_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.department import Department
from app.utils.helpers import log_activity
from app import db

dept_bp = Blueprint("department", __name__, url_prefix="/api/departments")

@dept_bp.route('', methods=['POST'])
@jwt_required()
def create_department():
    data = request.json
    if Department.query.filter_by(did=data["did"]).first():
        return jsonify({"error": "Department already exists"}), 409
    dept = Department(
        did=data["did"],
        name=data["name"],
        oid=data["oid"],
        managerId=data["managerId"]
    )
    db.session.add(dept)
    db.session.commit()
    log_activity("Department", dept.name, "created")
    return jsonify({"message": "Department created"}), 201

@dept_bp.route('', methods=['GET'])
@jwt_required()
def get_departments():
    depts = Department.query.all()
    return jsonify([{
        "id": d.id,
        "did": d.did,
        "name": d.name,
        "oid": d.oid,
        "managerId": d.managerId,
        "createdAt": d.createdAt.isoformat() if d.createdAt else None,
        "updatedAt": d.updatedAt.isoformat() if d.updatedAt else None
    } for d in depts])

@dept_bp.route('/<did>', methods=['PUT'])
@jwt_required()
def update_department(did):
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({'error': 'Department not found'}), 404

    data = request.json
    dept.name = data.get('name', dept.name)
    dept.oid = data.get('oid', dept.oid)
    dept.managerId = data.get('managerId', dept.managerId)

    db.session.commit()
    log_activity("Department", dept.name, "updated")

    return jsonify({
        'did': dept.did,
        'name': dept.name,
        'oid': dept.oid,
        'managerId': dept.managerId
    }), 200

@dept_bp.route('/<did>', methods=['DELETE'])
@jwt_required()
def delete_department(did):
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404
    db.session.delete(dept)
    db.session.commit()
    log_activity("Department", dept.name, "deleted")
    return jsonify({"message": "Department deleted"}), 200