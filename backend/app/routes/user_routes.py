### app/routes/user_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.utils.helpers import user_to_json, log_activity
from werkzeug.security import generate_password_hash
from app import db

user_bp = Blueprint("user", __name__, url_prefix="/api")

@user_bp.route('/employees', methods=['GET', 'POST'])
@jwt_required()
def employees():
    if request.method == 'GET':
        users = User.query.filter(User.role.in_(["employee", "admin"])).all()
        return jsonify([user_to_json(u) for u in users])
    elif request.method == 'POST':
        data = request.json
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "User already exists"}), 409
        user = User(
            eid=data.get("eid"),
            fname=data.get("fname"),
            lname=data.get("lname"),
            email=data["email"],
            password=generate_password_hash(data["password"]),
            role=data.get("role", "employee"),
            did=data.get("did"),
            joinDate=data.get("joinDate"),
            status=data.get("status", "active")
        )
        db.session.add(user)
        db.session.commit()
        log_activity("Employee", f"{user.fname} {user.lname}", "created")
        return jsonify({"message": "User created", "user": user_to_json(user)}), 201

@user_bp.route('/employees/<eid>', methods=['PUT', 'DELETE'])
@jwt_required()
def employee_by_id(eid):
    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if request.method == 'PUT':
        data = request.json
        user.fname = data.get("fname", user.fname)
        user.lname = data.get("lname", user.lname)
        user.email = data.get("email", user.email)
        user.did = data.get("did", user.did)
        if data.get("password"):
            user.password = generate_password_hash(data["password"])
        db.session.commit()
        log_activity("Employee", f"{user.fname} {user.lname}", "updated")
        return jsonify({"message": "User updated", "user": user_to_json(user)}), 200

    elif request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        log_activity("Employee", f"{user.fname} {user.lname}", "deleted")
        return jsonify({"message": "User deleted"}), 200

@user_bp.route('/search/users', methods=['GET'])
@jwt_required()
def search_users():
    query = request.args.get('q', '').strip().lower()
    if not query:
        return jsonify([])

    results = User.query.filter(
        db.or_(
            db.func.lower(User.fname).like(f'%{query}%'),
            db.func.lower(User.lname).like(f'%{query}%'),
            db.func.lower(User.email).like(f'%{query}%'),
            db.func.lower(User.eid).like(f'%{query}%')
        )
    ).all()

    return jsonify([user_to_json(u) for u in results])