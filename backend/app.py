from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["dashboardDB"]

# Valid roles
ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# ----------------------------
# Authentication
# ----------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = db.users.find_one({"email": email})
    
    if not user or user.get("password") != password:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "role": user.get("role")
        },
        "token": "dummy-token"
    })


# ----------------------------
# User Management
# ----------------------------
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    role = data.get("role", "").strip().lower()  # ✅ Normalize role

    if not email or not name or not password:
        return jsonify({"error": "All fields are required"}), 400

    if role not in ROLES:
        return jsonify({"error": f"Invalid role: '{role}'"}), 400  # Show debug info

    if db.users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 409

    data["role"] = role  # ✅ Store normalized role
    db.users.insert_one(data)
    return jsonify({"message": "User created"}), 201



@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "User deleted"}), 200
    return jsonify({"error": "User not found"}), 404


@app.route('/api/users/<user_id>/role', methods=['PATCH'])
def update_role(user_id):
    data = request.json
    new_role = data.get('role')

    if new_role not in ROLES:
        return jsonify({"error": "Invalid role"}), 400

    result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": new_role}})
    if result.matched_count == 1:
        return jsonify({"message": "Role updated"}), 200
    return jsonify({"error": "User not found"}), 404


@app.route('/api/users', methods=['GET'])
def get_users():
    users = list(db.users.find({}))
    for user in users:
        user["_id"] = str(user["_id"])
    return jsonify(users)


# ----------------------------
# Leaderboard
# ----------------------------
@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    top_users = list(db.users.find({"role": "employee"}).sort("working_hours", -1).limit(10))
    for user in top_users:
        user["_id"] = str(user["_id"])
    return jsonify(top_users)

# Create Organisation
@app.route('/api/organisations', methods=['POST'])
def create_organisation():
    data = request.json
    oid = data.get("oid", "").strip()
    name = data.get("name", "").strip()

    if not oid or not name:
        return jsonify({"error": "Organisation ID and name are required"}), 400

    if db.organisations.find_one({"oid": oid}):
        return jsonify({"error": "Organisation already exists"}), 409

    db.organisations.insert_one({"oid": oid, "name": name})
    return jsonify({"message": "Organisation created"}), 201

@app.route('/api/departments', methods=['POST'])
def create_department():
    data = request.json
    did = data.get("did", "").strip()
    name = data.get("name", "").strip()
    oid = data.get("oid", "").strip()

    if not did or not name or not oid:
        return jsonify({"error": "All fields required"}), 400

    if not db.organisations.find_one({"oid": oid}):
        return jsonify({"error": "Organisation does not exist"}), 404

    if db.departments.find_one({"did": did}):
        return jsonify({"error": "Department already exists"}), 409

    db.departments.insert_one({"did": did, "name": name, "oid": oid})
    return jsonify({"message": "Department created"}), 201


@app.route('/api/organisations/<oid>', methods=['DELETE'])
def delete_organisation(oid):
    result = db.organisations.delete_one({"oid": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Organisation not found"}), 404
    # Optionally delete associated departments
    db.departments.delete_many({"oid": oid})
    return jsonify({"message": "Organisation and related departments deleted"}), 200

@app.route('/api/departments/<did>', methods=['DELETE'])
def delete_department(did):
    result = db.departments.delete_one({"did": did})
    if result.deleted_count == 0:
        return jsonify({"error": "Department not found"}), 404
    return jsonify({"message": "Department deleted"}), 200


# ----------------------------
# Run Server
# ----------------------------
if __name__ == '__main__':
    app.run(debug=True)
