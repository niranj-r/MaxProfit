### app/routes/auth.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app.utils.jwt_utils import generate_token
from app.utils.helpers import user_to_json
from app import db

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password, data.get("password")):
        return jsonify({"error": "Invalid email or password"}), 401
    token = generate_token(user)
    return jsonify({
        "message": "Login successful",
        "user": user_to_json(user),
        "token": token
    })

@auth_bp.route('/admin/signup', methods=['POST'])
def admin_signup():
    try:
        data = request.get_json()
        fname = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "admin")

        if not fname or not email or not password:
            return jsonify({"error": "All fields are required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "User already exists"}), 400

        hashed_pw = generate_password_hash(password)

        new_user = User(
            fname=fname,
            email=email,
            password=hashed_pw,
            role=role
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Admin created successfully"}), 201

    except Exception as e:
        print("Error in admin signup route:", str(e))
        return jsonify({"error": "Internal server error"}), 500
