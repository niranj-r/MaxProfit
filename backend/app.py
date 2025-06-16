from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from dotenv import load_dotenv
import os
import re 
from sqlalchemy import and_
from jwt_utils import token_required, generate_token
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
  # use a secure, secret value


# ------------------ CONFIGURATION ------------------

load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("MYSQL_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
jwt = JWTManager(app)
db = SQLAlchemy(app)

# ------------------ CONSTANTS ------------------

ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# ------------------ MODELS ------------------

project_assignees = db.Table(
    'project_assignees',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role', db.String(100))
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    eid = db.Column(db.String(20), unique=True)
    fname = db.Column(db.String(100))
    lname = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))
    role = db.Column(db.String(50))
    did = db.Column(db.String(20))
    working_hours = db.Column(db.Integer, default=0)
    joinDate = db.Column(db.Date)
    status = db.Column(db.String(50))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Organisation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    oid = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(100))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    did = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(100))
    oid = db.Column(db.String(20))
    managerId = db.Column(db.String(100))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    departmentId = db.Column(db.String(20))
    startDate = db.Column(db.Date)
    endDate = db.Column(db.Date)
    budget = db.Column(db.Float)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))
    name = db.Column(db.String(100))
    action = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ------------------ HELPERS ------------------


def log_activity(entity_type, entity_name, action):
    try:
        new_log = ActivityLog(
            type=entity_type,
            name=entity_name,
            action=action,
            timestamp=datetime.utcnow()
        )
        db.session.add(new_log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to log activity: {str(e)}")


def user_to_json(u):
    return {
        "id": u.id,
        "eid": u.eid,
        "fname": u.fname,
        "lname": u.lname,
        "email": u.email,
        "role": u.role,
        "did": u.did,
        "joinDate": u.joinDate.strftime('%Y-%m-%d') if u.joinDate else None,
        "status": u.status,
        "createdAt": u.createdAt.isoformat() if u.createdAt else None,
        "updatedAt": u.updatedAt.isoformat() if u.updatedAt else None
    }
# ------------------ AUTH ------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password, data.get("password")):
        return jsonify({"error": "Invalid email or password"}), 401
    token = None
    if user.role == "admin":
        token = generate_token(user)
    return jsonify({
        "message": "Login successful",
        "user": user_to_json(user),
        "token": token  
    })

@app.route('/api/admin/signup', methods=['POST'])
def admin_signup():
    try:
        data = request.get_json()
        print("Received data:", data)

        fname = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "admin")

        if not fname or not email or not password:
            print("Missing fields")
            return jsonify({"error": "All fields are required"}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 400

        # Hash the password
        hashed_pw = generate_password_hash(data["password"])

        # Create user
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


# ------------------ USER ROUTES ------------------

# GET all employees, POST new employee
@app.route('/api/employees', methods=['GET', 'POST'])
@jwt_required()
def employees():
    if request.method == 'GET':
        return get_users()
    elif request.method == 'POST':
        return create_user()

# PUT to update employee, DELETE to remove
@app.route('/api/employees/<eid>', methods=['PUT', 'DELETE'])
@jwt_required()
def employee_by_id(eid):
    if request.method == 'PUT':
        return update_user(eid)
    elif request.method == 'DELETE':
        return delete_user(eid)

@app.route('/api/search/users', methods=['GET'])
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


@app.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    data = request.json

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "User already exists"}), 409

    did = data.get("did", "").strip()

    # ✅ Validate did before using it
    if not did or not did.isalpha():
        return jsonify({"error": "Department ID must contain only alphabets"}), 400

    user = User(
        eid=data.get("eid"),
        fname=data.get("fname"),
        lname=data.get("lname"),
        email=data["email"],
        password=generate_password_hash(data["password"]),
        role=data.get("role", "employee"),
        did=did,
        joinDate=datetime.strptime(data["joinDate"], "%Y-%m-%d") if data.get("joinDate") else None,
        status=data.get("status", "active")
    )

    db.session.add(user)
    db.session.commit()
    log_activity("Employee", f"{user.fname} {user.lname}", "created")

    return jsonify({"message": "User created", "user": user_to_json(user)}), 201


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.filter_by(role='employee').all()
    return jsonify([user_to_json(u) for u in users])

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    log_activity("Employee", f"{user.fname} {user.lname}", "deleted")
    return jsonify({"message": "User deleted"}), 200

@app.route('/api/users/<eid>', methods=['PUT'])
@jwt_required() 
def update_user(eid):
    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.json
    user.fname = data.get("fname", user.fname)
    user.lname = data.get("lname", user.lname)
    user.email = data.get("email", user.email)
    user.did = data.get("did", user.did)
    # Optional: Only update password if provided
    if data.get("password"):
        user.password = generate_password_hash(data["password"])
    db.session.commit()
    log_activity("Employee", f"{user.fname} {user.lname}", "updated")
    return jsonify({"message": "User updated", "user": user_to_json(user)}), 200


# ------------------ ORGANISATIONS ------------------

@app.route('/api/organisations', methods=['POST'])
@jwt_required()
def create_organisation():
    data = request.json
    if Organisation.query.filter_by(oid=data["oid"]).first():
        return jsonify({"error": "Organisation already exists"}), 409
    org = Organisation(oid=data["oid"], name=data["name"])
    db.session.add(org)
    db.session.commit()
    log_activity("Organisation", org.name, "created")
    return jsonify({
        "message": "Organisation created",
        "organisation": {"oid": org.oid, "name": org.name}
    }), 201

@app.route('/api/organisations', methods=['GET'])
@jwt_required()
def get_organisations():
    orgs = Organisation.query.all()
    return jsonify([
        {
            "id": o.id,
            "oid": o.oid,
            "name": o.name,
            "createdAt": o.createdAt.isoformat() if o.createdAt else None,
            "updatedAt": o.updatedAt.isoformat() if o.updatedAt else None
        }
        for o in orgs
    ])

@app.route('/api/organisations/<oid>', methods=['DELETE'])
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

@app.route('/api/organisations/<oid>', methods=['PUT'])
@jwt_required()
def update_organisation(oid):
    org = Organisation.query.filter_by(oid=oid).first()
    if not org:
        return jsonify({"error": "Organisation not found"}), 404

    data = request.json
    org.name = data.get("name", org.name)
    db.session.commit()
    log_activity("Organisation", org.name, "updated")

    return jsonify({
        "oid": org.oid,
        "name": org.name,
        "createdAt": org.createdAt.isoformat() if org.createdAt else None
    }), 200

# ------------------ DEPARTMENTS ------------------

@app.route('/api/departments', methods=['POST'])
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

@app.route('/api/departments', methods=['GET'])
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

@app.route('/api/departments/<did>', methods=['DELETE'])
@jwt_required()
def delete_department(did):
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404
    db.session.delete(dept)
    db.session.commit()
    log_activity("Department", dept.name, "deleted")
    return jsonify({"message": "Department deleted"}), 200

@app.route('/api/departments/<did>', methods=['PUT'])
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


# ------------------ PROJECTS ------------------

@app.route('/api/projects', methods=['POST'])
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

@app.route('/api/projects', methods=['GET'])
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

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    proj = Project.query.get(project_id)
    if not proj:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(proj)
    db.session.commit()
    log_activity("Project", proj.name, "deleted")
    return jsonify({"message": "Project deleted"}), 200

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
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

@app.route('/api/project-budgets', methods=['GET'])
@jwt_required()
def get_project_budgets():
    projects = Project.query.with_entities(Project.name, Project.budget).all()
    result = [{"name": name, "budget": budget} for name, budget in projects]
    return jsonify(result), 200

@app.route('/api/projects/upcoming-deadlines', methods=['GET'])
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
    result = [{
        "id": p.id,
        "name": p.name,
        "endDate": p.endDate.strftime('%Y-%m-%d')
    } for p in upcoming]

    return jsonify(result), 200

# ------------------ ASSIGNEES ROUTES ------------------
@app.route("/api/projects/<int:project_id>/assignees", methods=["GET"])
@jwt_required()
def get_assignees(project_id):
    results = db.session.execute(
        db.select(User, project_assignees.c.role)
        .join(project_assignees, User.id == project_assignees.c.user_id)
        .where(project_assignees.c.project_id == project_id)
    )

    assignees = []
    for user, role in results:
        assignees.append({
            "eid": user.eid,
            "fname": user.fname,
            "lname": user.lname,
            "email": user.email,
            "role": role  # Include the role
        })

    return jsonify(assignees), 200


@app.route('/api/projects/<int:project_id>/assignees', methods=['POST'])
@jwt_required()
def add_assignee(project_id):
    data = request.json
    eid = data.get("eid")
    role = data.get("role", "").strip()

    if not eid or not role:
        return jsonify({"error": "EID and role required"}), 400

    # Fetch project & user
    project = db.session.get(Project, project_id)
    user = User.query.filter_by(eid=eid).first()
    if not project or not user:
        return jsonify({"error": "Project or user not found"}), 404

    # Prevent duplicate assignment
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

    # 🔒 Enforce single Project Manager
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

    # Insert with role
    db.session.execute(
        project_assignees.insert().values({
            "project_id": project_id,
            "user_id": user.id,
            "role": role
        })
    )
    db.session.commit()
    return jsonify({"message": "Assignee added with role"}), 200

@app.route('/api/projects/<int:project_id>/assignees/<eid>', methods=['DELETE'])
@jwt_required()
def remove_assignee(project_id, eid):
    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.execute(
        project_assignees.delete().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    )
    db.session.commit()
    return jsonify({"message": "Assignee removed"}), 200

# ------------------ RECENT ACTIVITY ------------------
@app.route("/api/recent-activities", methods=["GET"])
@jwt_required()
def get_recent_activities():
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    result = [
        {
            "entity": a.type,
            "user": a.name,
            "action": a.action,
            "timestamp": a.timestamp.isoformat()
        }
        for a in activities
    ]
    return jsonify(result), 200



# ------------------ MAIN ------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
