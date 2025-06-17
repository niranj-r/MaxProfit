### app/routes/organisation_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.organisation import Organisation
from app.models.department import Department
from app.utils.helpers import log_activity
from app import db

org_bp = Blueprint("organisation", __name__, url_prefix="/api/organisations")

@org_bp.route('', methods=['POST'])
@jwt_required()
def create_organisation():
    data = request.json
    if Organisation.query.filter_by(oid=data["oid"]).first():
        return jsonify({"error": "Organisation already exists"}), 409
    org = Organisation(oid=data["oid"], name=data["name"])
    db.session.add(org)
    db.session.commit()
    log_activity("Organisation", org.name, "created")
    return jsonify({"message": "Organisation created", "organisation": {"oid": org.oid, "name": org.name}}), 201

@org_bp.route('', methods=['GET'])
@jwt_required()
def get_organisations():
    orgs = Organisation.query.all()
    return jsonify([{
        "id": o.id,
        "oid": o.oid,
        "name": o.name,
        "createdAt": o.createdAt.isoformat() if o.createdAt else None,
        "updatedAt": o.updatedAt.isoformat() if o.updatedAt else None
    } for o in orgs])

@org_bp.route('/<oid>', methods=['PUT'])
@jwt_required()
def update_organisation(oid):
    org = Organisation.query.filter_by(oid=oid).first()
    if not org:
        return jsonify({"error": "Organisation not found"}), 404
    data = request.json
    org.name = data.get("name", org.name)
    db.session.commit()
    log_activity("Organisation", org.name, "updated")
    return jsonify({"oid": org.oid, "name": org.name, "createdAt": org.createdAt.isoformat() if org.createdAt else None}), 200

@org_bp.route('/<oid>', methods=['DELETE'])
@jwt_required()
def delete_organisation(oid):
    org = Organisation.query.filter_by(oid=oid).first()
    if not org:
        return jsonify({"error": "Organisation not found"}), 404
    Department.query.filter_by(oid=oid).delete()
    db.session.delete(org)
    db.session.commit()
    log_activity("Organisation", org.name, "deleted")
    return jsonify({"message": "Organisation and related departments deleted"}), 200