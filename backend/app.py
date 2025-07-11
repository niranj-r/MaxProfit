from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from sqlalchemy import and_, select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import aliased
from sqlalchemy import extract
import os

# JWT utility functions (assuming you have jwt_utils.py)
from jwt_utils import token_required, generate_token


# ------------------ CONFIGURATION ------------------

load_dotenv()
app = Flask(__name__)
CORS(app)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
print("🔧 DB URI:", app.config['SQLALCHEMY_DATABASE_URI'])

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET")

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ------------------ CONSTANTS ------------------

ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# ------------------ MODELS ------------------

project_assignees = db.Table(
    'project_assignees',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role', db.String(100))
)

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(100), unique=True, nullable=False)
    privileges = db.Column(db.String(255))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

# In app.py or routes.py
@app.route('/api/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = Role.query.all()
    return jsonify([r.role for r in roles])

class EmployeeFinancials(db.Model):
    __tablename__ = 'employee_financials'

    id = db.Column(db.Integer, primary_key=True)
    eid = db.Column(db.String(20), nullable=False)  # FK removed
    salary = db.Column(db.Float, nullable=True)
    infrastructure = db.Column(db.Float, nullable=True)
    hourly_cost = db.Column(db.Float, nullable=True)  # 👈 Added this line
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    financial_year = db.Column(db.String(20), nullable=False)

class FinancialYear(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(20), nullable=False, unique=True)  # e.g., "2024-2025"

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label
        }


from sqlalchemy import Date

class ProjectAssignment(db.Model):
    __tablename__ = 'project_assignment'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    allocated_percentage = db.Column(db.Integer, nullable=False)
    allocated_hours = db.Column(db.Integer)
    billing_rate = db.Column(db.Float)
    cost = db.Column(db.Float)
    start_date = db.Column(Date)  # Add this line
    end_date = db.Column(Date)    # And this line
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    actual_cost = db.Column(db.Float, nullable=True)  # 👈 Add this

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
    managerIds = db.Column(db.Text, nullable=True) 
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

# ------------------ BASIC TEST ROUTE ------------------

@app.route("/")
def home():
    return {"message": "Backend running"}, 200

# ------------------ FINANCIAL YEARS ------------------

@app.route("/financial-years", methods=["GET"])
def get_financial_years():
    years = FinancialYear.query.all()
    return jsonify([year.to_dict() for year in years]), 200

@app.route("/financial-years", methods=["POST"])
def add_financial_year():
    data = request.get_json()
    start_year = data.get("start_year")

    if not isinstance(start_year, int):
        return jsonify({"error": "Invalid or missing start_year"}), 400

    label = f"{start_year}-{start_year + 1}"

    if FinancialYear.query.filter_by(label=label).first():
        return jsonify({"error": "Financial year already exists"}), 400

    year = FinancialYear(label=label)
    db.session.add(year)
    db.session.commit()
    return jsonify(year.to_dict()), 201

@app.route("/financial-years/<int:id>", methods=["DELETE"])
def delete_financial_year(id):
    year = FinancialYear.query.get(id)
    if not year:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(year)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
#------------------FINANCIAL YEAR PAGE-----------------
@app.route('/api/employee-financials', methods=['GET'])
@jwt_required()
def get_employee_financials():
    year = request.args.get("year")  # read year from query param

    users = User.query.filter(
        User.role.in_(['employee', 'department_manager']),
        User.status == 'active'
    ).all()

    result = []
    for user in users:
        query = EmployeeFinancials.query.filter_by(eid=user.eid)
        if year:
            query = query.filter_by(financial_year=year)

        financial = query.first()
        salary = financial.salary if financial else None
        infrastructure = financial.infrastructure if financial else None
        cost = None
        if salary is not None and infrastructure is not None:
            cost = salary + infrastructure
        result.append({
            "eid": user.eid,
            "fname": user.fname,
            "lname": user.lname,
            "salary": salary,
            "infrastructure": infrastructure,
            "cost": cost
        })

    return jsonify(result), 200



# POST to update a user's financials
@app.route('/api/employee-financials/<eid>', methods=['POST'])
@jwt_required()
def update_employee_financials(eid):
    data = request.get_json()
    salary = data.get("salary")
    infrastructure = data.get("infrastructure")
    financial_year = data.get("financial_year")  # 👈 NEW

    if not financial_year:
        return jsonify({"error": "Financial year is required."}), 400

    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    financial = EmployeeFinancials.query.filter_by(eid=eid, financial_year=financial_year).first()
    if not financial:
        financial = EmployeeFinancials(eid=eid, financial_year=financial_year)
        db.session.add(financial)

    financial.salary = salary
    financial.infrastructure = infrastructure
    financial.hourly_cost = (salary + infrastructure) / 176 if salary is not None and infrastructure is not None else None

    db.session.commit()

    return jsonify({"message": "Financial data updated"}), 200

# ------------------ PROJECT ASSIGNMENTS ------------------

def working_days(start_date, end_date): 
    total = 0
    curr = start_date
    while curr <= end_date:
        if curr.weekday() < 5:  # 0–4 are Mon–Fri
            total += 1
        curr += timedelta(days=1)
    return total
@app.route('/api/assign-task', methods=['POST'])
@jwt_required()
def assign_task():
    from datetime import datetime, timedelta

    def working_days(start_date, end_date):
        day_count = 0
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() < 5:
                day_count += 1
            current_date += timedelta(days=1)
        return day_count

    try:
        print("📥 Received request to /api/assign-task")
        data = request.get_json()
        print(f"🔍 Request JSON: {data}")

        if not data:
            return jsonify({"error": "No data provided"}), 400

        project_id = data.get('project_id')
        assignments = data.get('assignments', [])

        print(f"📌 project_id: {project_id}, Assignments count: {len(assignments)}")

        if project_id is None:
            return jsonify({"error": "project_id is required"}), 400

        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return jsonify({"error": "project_id must be an integer"}), 400

        if not assignments or not isinstance(assignments, list):
            return jsonify({"error": "Assignments must be a non-empty array"}), 400

        project = Project.query.get(project_id)
        if not project:
            print(f"🚫 Project {project_id} not found.")
            return jsonify({"error": "Project not found"}), 404

        validated_assignments = []
        total_percentage = 0
        allocations = []

        for assignment in assignments:
            print(f"🧪 Validating assignment: {assignment}")

            if not all(key in assignment for key in ['user_id', 'percentage', 'billing_rate', 'start_date', 'end_date']):
                return jsonify({"error": "Each assignment requires user_id, percentage, billing_rate, start_date, and end_date"}), 400

            try:
                user_id = int(assignment['user_id'])
                percentage = float(assignment['percentage'])
                billing_rate = float(assignment['billing_rate'])
                start_date = datetime.strptime(assignment['start_date'], "%Y-%m-%d").date()
                end_date = datetime.strptime(assignment['end_date'], "%Y-%m-%d").date()
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid numeric or date values in assignment. Date format: YYYY-MM-DD"}), 400

            user = User.query.get(user_id)
            if not user:
                print(f"🚫 User with ID {user_id} not found.")
                return jsonify({"error": f"User with ID {user_id} not found"}), 404

            if percentage <= 0 or percentage > 100:
                return jsonify({"error": "Percentage must be between 0 and 100"}), 400

            working_days_count = working_days(start_date, end_date)
            HOURS_PER_DAY = 8
            allocated_hours = working_days_count * HOURS_PER_DAY * (percentage / 100.0)
            cost = billing_rate * allocated_hours

            # 🔁 Actual Cost Calculation (from employee_financials)
            fy_start = start_date.year if start_date.month >= 4 else start_date.year - 1
            financial_year = f"{fy_start}-{fy_start + 1}"
            eid = user.eid

            emp_fin = db.session.execute(
                db.select(EmployeeFinancials).where(
                    EmployeeFinancials.eid == eid,
                    EmployeeFinancials.financial_year == financial_year
                )
            ).scalar_one_or_none()

            if not emp_fin:
                return jsonify({"error": f"No hourly cost found for {eid} in FY {financial_year}"}), 404

            actual_cost = round(emp_fin.hourly_cost * allocated_hours, 2)

            allocation_data = {
                'user_id': user_id,
                'project_id': project_id,
                'allocated_percentage': percentage,
                'billing_rate': billing_rate,
                'allocated_hours': allocated_hours,
                'cost': round(cost, 2),
                'start_date': start_date,
                'end_date': end_date,
                'actual_cost': actual_cost
            }

            total_percentage += percentage
            allocations.append(allocation_data)
            validated_assignments.append(allocation_data)

        if total_percentage > 100:
            print(f"⚠ Total percentage exceeds 100%: {total_percentage}")
            return jsonify({
                "error": f"Total percentage exceeds 100% (current: {total_percentage}%)",
                "total_percentage": total_percentage
            }), 400

        for assignment in validated_assignments:
            existing = ProjectAssignment.query.filter_by(
                user_id=assignment['user_id'],
                project_id=project_id
            ).first()

            if existing:
                print(f"✏ Updating existing assignment for {assignment['user_id']}")
                existing.allocated_percentage = assignment['allocated_percentage']
                existing.allocated_hours = assignment['allocated_hours']
                existing.billing_rate = assignment['billing_rate']
                existing.cost = assignment['cost']
                existing.start_date = assignment['start_date']
                existing.end_date = assignment['end_date']
                existing.actual_cost = assignment['actual_cost']
            else:
                print(f"➕ Creating new assignment for {assignment['user_id']}")
                new_assignment = ProjectAssignment(**assignment)
                db.session.add(new_assignment)

            assignee_exists = db.session.execute(
                db.select(project_assignees).where(
                    project_assignees.c.project_id == project_id,
                    project_assignees.c.user_id == assignment['user_id']
                )
            ).first()

            if not assignee_exists:
                print(f"📌 Linking user {assignment['user_id']} to project {project_id} in project_assignees")
                db.session.execute(
                    project_assignees.insert().values(
                        project_id=project_id,
                        user_id=assignment['user_id']
                    )
                )

        db.session.commit()
        print("✅ Assignments committed to DB")

        return jsonify({
            "message": "Tasks assigned successfully",
            "allocations": allocations,
            "total_percentage": total_percentage
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"❌ Database error: {str(e)}")
        return jsonify({"error": "Database operation failed"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"❗ Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/api/projects/<int:project_id>/assignees/<eid>', methods=['DELETE'])
@jwt_required()
def remove_task_assignment(project_id, eid):
    try:
        print(f"🗑 Removing assignment: project_id={project_id}, eid={eid}")

        user = User.query.filter_by(eid=eid).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Delete from ProjectAssignment table
        assignment = ProjectAssignment.query.filter_by(
            project_id=project_id,
            user_id=user.id
        ).first()

        if assignment:
            db.session.delete(assignment)
            print(f"🗑 Deleted from ProjectAssignment for user_id={user.id}")

        # Remove from project_assignees join table
        db.session.execute(
            project_assignees.delete().where(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
        print(f"🧹 Removed from project_assignees for user_id={user.id}")

        db.session.commit()
        print("✅ Assignment and assignee link deleted")
        return jsonify({"message": "Assignment removed successfully"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"❌ DB error: {str(e)}")
        return jsonify({"error": "Failed to remove assignment"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"❗ Unexpected error: {str(e)}")
        return jsonify({"error": "Unexpected error"}), 500



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

    token = generate_token(user)

    # Check if the user is a project manager in the assignments table
    stmt = select(project_assignees).where(project_assignees.c.user_id == user.id)
    pa_results = db.session.execute(stmt).fetchall()

    # Set role to 'Project Manager' if any assignment has that role
    pa_role = 'Project Manager' if any(row.role == 'Project Manager' for row in pa_results) else None


    return jsonify({
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "pa_role": pa_role  # <-- add this
        },
        "userName": user.fname,
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
            return jsonify({"error": "All fields are required"}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 400

        # Generate next eid like AD01, AD02, ...
        admin_count = User.query.filter(User.eid.like('AD%')).count() + 1
        eid = f"AD{admin_count:02d}"  # zero-padded 2 digits

        if " " in data.get("name"):
            fname, lname = data.get("name").split(" ", 1)
        else:
            fname = data.get("name")
            lname = " "

        # Hash the password
        hashed_pw = generate_password_hash(password)

        # Create new user
        new_user = User(
            eid=eid,
            did="ADMIN",
            fname=fname,
            lname=lname,
            email=email,
            password=hashed_pw,
            role=role,
            status="active"
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Admin created successfully", "eid": eid}), 201

    except Exception as e:
        print("Error in admin signup route:", str(e))
        return jsonify({"error": "Internal server error"}), 500
    
# ------------------ Project Manager ------------------

@app.route('/api/my-projects', methods=['GET'])
@jwt_required()
def get_my_projects():
    user_id = get_jwt_identity()

    # Get projects where user is Project Manager
    stmt = select(project_assignees.c.project_id).where(
        and_(
            project_assignees.c.user_id == user_id,
            project_assignees.c.role == 'Project Manager'
        )
    )
    results = db.session.execute(stmt).fetchall()
    project_ids = [row[0] for row in results]

    # Get project details with total cost
    project_data = (
        db.session.query(
            Project.id,
            Project.name,
            Project.departmentId,
            Project.startDate,
            Project.endDate,
            Project.createdAt,
            Project.updatedAt,
            func.coalesce(func.sum(ProjectAssignment.cost), 0).label("total_cost"),
            func.coalesce(func.sum(ProjectAssignment.actual_cost), 0).label("actual_cost")
        )
        .outerjoin(ProjectAssignment, Project.id == ProjectAssignment.project_id)
        .filter(Project.id.in_(project_ids))
        .group_by(Project.id)
        .all()
    )

    # Format and return
    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "cost": float(p.total_cost), 
            "actual_cost": float(p.actual_cost), # calculated cost
            "departmentId": p.departmentId,
            "startDate": p.startDate.strftime('%Y-%m-%d'),
            "endDate": p.endDate.strftime('%Y-%m-%d'),
            "createdAt": p.createdAt.isoformat() if p.createdAt else None,
            "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
        } for p in project_data
    ])

@app.route('/api/pm-project-budgets', methods=['GET'])
@jwt_required()
def get_pm_project_budgets():
    current_user_id = get_jwt_identity()

    # Step 1: Get project_ids where user is PM
    stmt = select(project_assignees.c.project_id).where(
        and_(
            project_assignees.c.user_id == current_user_id,
            project_assignees.c.role == 'Project Manager'
        )
    )
    project_ids = [row[0] for row in db.session.execute(stmt).all()]

    if not project_ids:
        return jsonify([]), 200

    # Step 2: Query project summaries (revenue, cost, margin)
    results = (
        db.session.query(
            Project.name,
            func.coalesce(func.sum(ProjectAssignment.cost), 0).label("revenue"),
            func.coalesce(func.sum(ProjectAssignment.actual_cost), 0).label("actual_cost")
        )
        .join(ProjectAssignment, Project.id == ProjectAssignment.project_id)
        .filter(Project.id.in_(project_ids))
        .group_by(Project.name)
        .all()
    )

    # Step 3: Format and return the result
    return jsonify([
        {
            "name": name,
            "cost": float(revenue),          # revenue is stored under 'cost' (frontend expects this)
            "actual_cost": float(actual_cost),
            "margin": float(revenue) - float(actual_cost)
        }
        for name, revenue, actual_cost in results
    ]), 200

@app.route('/api/pm-my-projects', methods=['GET'])
@jwt_required()
def g_projects():
    current_user_id = get_jwt_identity()

    # Get project IDs from assignments where user is a PM
    assignments = db.session.query(project_assignees).filter_by(user_id=current_user_id, role="Project Manager").all()
    project_ids = [a.project_id for a in assignments]

    projects = Project.query.filter(Project.id.in_(project_ids)).all()

    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "departmentId": p.departmentId,
            "startDate": p.startDate.strftime('%Y-%m-%d') if p.startDate else None,
            "endDate": p.endDate.strftime('%Y-%m-%d') if p.endDate else None,
            "budget": p.budget,
            "createdAt": p.createdAt.isoformat() if p.createdAt else None,
            "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
        }
        for p in projects
    ])
@app.route('/api/projects/<int:project_id>/pm-assignees/<eid>', methods=['DELETE'])
@jwt_required()
def remove_pm_assignee(project_id, eid):
    print(f"[DELETE] Request to remove assignee EID={eid} from Project ID={project_id}")

    user = User.query.filter_by(eid=eid).first()
    if not user:
        print(f"[ERROR] User with EID={eid} not found")
        return jsonify({"error": "User not found"}), 404

    print(f"[INFO] Found User ID={user.id} with EID={user.eid}")

    # 1️⃣ Check project_assignees table
    assignment = db.session.execute(
        project_assignees.select().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    ).first()

    if not assignment:
        print(f"[ERROR] No assignment found for user {user.eid} in project {project_id}")
        return jsonify({"error": "Assignee not found in project"}), 404

    role = assignment._mapping.get("role")
    print(f"[INFO] Assignee role is '{role}'")

    if role == "Project Manager":
        print("[BLOCKED] Cannot remove the Project Manager")
        return jsonify({"error": "Cannot remove the Project Manager from the project"}), 403

    # 2️⃣ Delete from project_assignees
    db.session.execute(
        project_assignees.delete().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    )

    # 3️⃣ Delete from project_assignment (task assignments)
    db.session.execute(
        db.delete(ProjectAssignment).where(
            and_(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.user_id == user.id
            )
        )
    )

    db.session.commit()
    print(f"[SUCCESS] Assignee {user.eid} and their tasks removed from project {project_id}")
    return jsonify({"message": "Assignee removed"}), 200


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
    user = User(
        eid=data.get("eid"),
        fname=data.get("fname"),
        lname=data.get("lname"),
        email=data["email"],
        password=generate_password_hash(data["password"]),
        role=data.get("role", "employee"),
        did=data.get("did"),
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
    allowed_roles = ["employee", "admin", "department_manager"]
    users = User.query.filter(User.role.in_(allowed_roles)).all()
    return jsonify([user_to_json(u) for u in users])

@app.route('/api/users/dept', methods=['GET'])
@jwt_required()
def get_users_dept():
    allowed_roles = ["employee", "department_manager"]
    users = User.query.filter(User.role.in_(allowed_roles)).all()
    return jsonify([user_to_json(u) for u in users])




@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if user is a department manager
    is_manager = Department.query.filter_by(managerId=user.eid).first()
    if is_manager:
        return jsonify({"error": f"Cannot delete employee '{user.fname} {user.lname}' as they are managing department '{is_manager.name}'."}), 400

    try:
        # Step 1: Remove from project_assignees table
        db.session.execute(
            project_assignees.delete().where(project_assignees.c.user_id == user_id)
        )

        # Step 2: Log the action
        log_activity("Employee", f"{user.fname} {user.lname}", "deleted")

        # Step 3: Delete the user
        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "User deleted"}), 200

    except Exception as e:
        db.session.rollback()
        print("Error deleting user:", str(e))
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    data = request.json
    new_status = data.get('status')

    if new_status not in ['active', 'inactive']:
        return jsonify({'error': 'Invalid status'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.status = new_status
    db.session.commit()

    return jsonify({'message': 'Status updated'})



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

@app.route('/api/organisations/<org_id>', methods=['PUT'])
@jwt_required()
def update_organisation(org_id):
    data = request.get_json()
    new_name = data.get('name', '').strip()

    if not new_name:
        return jsonify({'error': 'Organisation name is required.'}), 400

    # Fetch using oid, not primary key id
    organisation = Organisation.query.filter_by(oid=org_id).first()
    if not organisation:
        return jsonify({'error': 'Organisation not found.'}), 404

    organisation.name = new_name
    db.session.commit()

    return jsonify({
        'oid': organisation.oid,
        'name': organisation.name
    }), 200

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

@app.route('/api/organisation-name', methods=['GET'])
@jwt_required()
def get_organisation_name():
    print("🔍 Incoming request to /api/organisation-name")
    try:
        org = Organisation.query.first()
        if not org:
            print("⚠️ No organisation found in database.")
            return jsonify({"error": "No organisation found"}), 404
        print(f"✅ Organisation found: {org.name}")
        return jsonify({"name": org.name}), 200
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return jsonify({"error": str(e)}), 500


# ------------------ DEPARTMENTS ------------------
# For Department table manager id
@app.route('/api/employees/dept', methods=['GET', 'POST'])
@jwt_required()
def employees_dept():
    if request.method == 'GET':
        return get_users_dept()
    elif request.method == 'POST':
        return create_user()


@app.route('/api/departments', methods=['POST'])
@jwt_required()
def create_department():
    data = request.json

    # Backward compatibility: support both managerId and managerIds
    manager_ids = data.get("managerIds") or []
    if not manager_ids and data.get("managerId"):
        manager_ids = [data.get("managerId")]

    # Only convert non-empty lists into comma-separated strings, else None
    manager_ids_csv = ','.join(manager_ids) if manager_ids else None
    primary_manager = manager_ids[0] if manager_ids else None

    # Create the department (no manager required)
    dept = Department(
        did=data.get("did"),
        name=data.get("name"),
        oid=data.get("oid"),
        managerId=primary_manager,
        managerIds=manager_ids_csv
    )
    db.session.add(dept)

    # Update roles for valid managers, if any
    for eid in manager_ids:
        manager = User.query.filter_by(eid=eid).first()
        if manager:
            manager.role = "department_manager"
        else:
            return jsonify({"error": f"Manager '{eid}' not found"}), 404

    try:
        db.session.commit()
        log_activity("Department", dept.name, "created")
        return jsonify({"message": "Department created"}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route('/api/departments', methods=['GET'])
@jwt_required()
def get_departments():
    depts = Department.query.all()
    dept_list = []
    
    for d in depts:
        # Handle both old single managerId and new multiple managerIds
        manager_ids = []
        if hasattr(d, 'managerIds') and d.managerIds:
            manager_ids = d.managerIds.split(',')
        elif d.managerId:
            manager_ids = [d.managerId]
        
        dept_data = {
            "id": d.id,
            "did": d.did,
            "name": d.name,
            "oid": d.oid,
            "managerId": d.managerId,  # Keep for backward compatibility
            "managerIds": manager_ids,  # New field for multiple managers
            "createdAt": d.createdAt.isoformat() if d.createdAt else None,
            "updatedAt": d.updatedAt.isoformat() if d.updatedAt else None
        }
        dept_list.append(dept_data)
    
    return jsonify(dept_list)


@app.route('/api/departments/<did>', methods=['PUT'])
@jwt_required()
def update_department(did):
    print(f"🔄 /api/departments/{did} PUT route hit")
    
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404

    data = request.json
    print("📥 Update Data:", data)

    # Get old manager IDs for role reversion
    old_manager_ids = []
    if hasattr(dept, 'managerIds') and dept.managerIds:
        old_manager_ids = dept.managerIds.split(',')
    elif dept.managerId:
        old_manager_ids = [dept.managerId]

    # Handle both single managerId (backward compatibility) and multiple managerIds
    new_manager_ids = data.get("managerIds", [])
    if not new_manager_ids and data.get("managerId"):
        # Backward compatibility: convert single managerId to array
        new_manager_ids = [data.get("managerId")]

    if not new_manager_ids:
        print("❌ No managers specified")
        return jsonify({"error": "At least one manager is required"}), 400

    # Validate all new manager IDs exist
    invalid_managers = []
    valid_new_managers = []
    
    for manager_id in new_manager_ids:
        manager = User.query.filter_by(eid=manager_id).first()
        if manager:
            valid_new_managers.append(manager)
        else:
            invalid_managers.append(manager_id)
    
    if invalid_managers:
        print(f"❌ Invalid manager IDs: {invalid_managers}")
        return jsonify({"error": f"Manager users not found: {', '.join(invalid_managers)}"}), 404

    # Update department fields
    dept.name = data.get("name", dept.name)
    dept.oid = data.get("oid", dept.oid)
    dept.managerId = new_manager_ids[0]  # Primary manager for backward compatibility
    dept.managerIds = ','.join(new_manager_ids)  # All managers

    # Handle role changes
    # First, revert old managers who are no longer managers of this department
    managers_to_remove = set(old_manager_ids) - set(new_manager_ids)
    for manager_id in managers_to_remove:
        manager = User.query.filter_by(eid=manager_id).first()
        if manager:
            # Check if they still manage other departments
            still_managing = Department.query.filter(
                Department.did != did,
                Department.managerIds.like(f'%{manager_id}%')
            ).first()
            
            if not still_managing:
                manager.role = "employee"
                print(f"🔄 Reverted {manager.eid}'s role back to employee")

    # Update new managers' roles
    for manager in valid_new_managers:
        manager.role = "department_manager"
        print(f"👤 Manager role updated: {manager.eid}")

    try:
        db.session.commit()
        print("✅ Department updated successfully")
        log_activity("Department", dept.name, "updated")
        
        # Return updated department data
        return jsonify({
            "id": dept.id,
            "did": dept.did,
            "name": dept.name,
            "oid": dept.oid,
            "managerId": dept.managerId,
            "managerIds": new_manager_ids,
            "createdAt": dept.createdAt.isoformat() if dept.createdAt else None,
            "updatedAt": dept.updatedAt.isoformat() if dept.updatedAt else None
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        print("💥 Database error:", str(e))
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route('/api/departments/<did>', methods=['DELETE'])
@jwt_required()
def delete_department(did):
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404

    employees_exist = User.query.filter_by(did=dept.name).first()
    if employees_exist:
        return jsonify({"error": "Cannot delete department with assigned employees"}), 400

    # Check for assigned projects
    projects_exist = Project.query.filter_by(departmentId=did).first()
    if projects_exist:
        return jsonify({"error": "Cannot delete department with existing projects"}), 400

    # Get all manager IDs for role reversion
    manager_ids_to_check = []
    if hasattr(dept, 'managerIds') and dept.managerIds:
        manager_ids_to_check = dept.managerIds.split(',')
    elif dept.managerId:
        manager_ids_to_check = [dept.managerId]

    db.session.delete(dept)
    db.session.commit()

    # Revert manager roles if they no longer manage any departments
    for manager_id in manager_ids_to_check:
        manager = User.query.filter_by(eid=manager_id).first()
        if manager:
            # Check if they still manage other departments
            still_managing = Department.query.filter(
                Department.managerIds.like(f'%{manager_id}%')
            ).first()
            
            if not still_managing:
                manager.role = "employee"
                db.session.commit()
                print(f"🔄 Reverted {manager.eid}'s role back to employee")

    log_activity("Department", dept.name, "deleted")
    return jsonify({"message": "Department deleted successfully"}), 200
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
        #budget=float(data["budget"])
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
        #"budget": p.budget,
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
    #project.budget = float(data['budget'])

    db.session.commit()
    log_activity("Project", project.name, "updated")
    return jsonify({
        'id': project.id,
        'name': project.name,
        'departmentId': project.departmentId,
        'startDate': project.startDate.strftime('%Y-%m-%d'),
        'endDate': project.endDate.strftime('%Y-%m-%d'),
        #'budget': project.budget
    }), 200

@app.route('/api/project-budgets', methods=['GET'])
@jwt_required()
def get_project_budgets():
    try:
        results = (
            db.session.query(Project.name, func.sum(ProjectAssignment.cost))
            .join(ProjectAssignment, Project.id == ProjectAssignment.project_id)
            .group_by(Project.name)
            .all()
        )
        return jsonify([
            {"name": name, "cost": float(cost)} for name, cost in results
        ]), 200
    except Exception as e:
        print("🔴 Error in /api/project-budgets:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<int:project_id>/total-cost', methods=['GET'])
@jwt_required()
def get_project_total_cost(project_id):
    total_cost = db.session.query(db.func.sum(ProjectAssignment.cost))\
        .filter_by(project_id=project_id).scalar()

    actual_cost = db.session.query(db.func.sum(ProjectAssignment.actual_cost))\
        .filter_by(project_id=project_id).scalar()

    return jsonify({
        "totalCost": float(total_cost or 0),
        "actualCost": float(actual_cost or 0)
    })

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
@app.route('/api/projects/<int:project_id>/assignees', methods=['GET'])
@jwt_required()
def get_assignees(project_id):
    result = db.session.query(
        User.eid,
        User.fname,
        User.lname,
        User.email,
        project_assignees.c.role,
        ProjectAssignment.allocated_hours,
        ProjectAssignment.billing_rate,
        ProjectAssignment.actual_cost,
        ProjectAssignment.allocated_percentage,
        ProjectAssignment.start_date,
        ProjectAssignment.end_date  

    ).join(
        project_assignees,
        and_(
            project_assignees.c.user_id == User.id,
            project_assignees.c.project_id == project_id
        )
    ).join(
        ProjectAssignment,
        and_(
            ProjectAssignment.user_id == User.id,
            ProjectAssignment.project_id == project_id
        ),
        isouter=True
    ).all()

    assignees = []
    for eid, fname, lname, email, role, hours, rate, actual_cost, allocated_percentage, start_date, end_date in result:
        cost = round((hours or 0) * (rate or 0), 2)
        assignees.append({
            'eid': eid,
            'fname': fname,
            'lname': lname,
            'email': email,
            'role': role,
            'cost': cost,
            'actual_cost': round(actual_cost, 2) if actual_cost is not None else None,
            'start_date': start_date.isoformat() if start_date else None,
            'end_date': end_date.isoformat() if end_date else None,
            'allocation_percentage': allocated_percentage if allocated_percentage is not None else None,

        })

    return jsonify(assignees)

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
    print(f"[DELETE] Request to remove EID={eid} from Project ID={project_id}")

    user = User.query.filter_by(eid=eid).first()
    if not user:
        print(f"[ERROR] User with EID={eid} not found")
        return jsonify({"error": "User not found"}), 404

    print(f"[INFO] Found User ID={user.id} with EID={user.eid}")

    # Check assignment to verify role
    assignment = db.session.execute(
        project_assignees.select().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    ).first()

    if not assignment:
        print(f"[ERROR] No assignment found for EID={eid} in project {project_id}")
        return jsonify({"error": "Assignee not found in project"}), 404

    role = assignment._mapping.get("role")
    print(f"[INFO] Assignee role is '{role}'")

    if role == "Project Manager":
        print("[BLOCKED] Cannot remove the Project Manager")
        return jsonify({"error": "Cannot remove the Project Manager from the project"}), 403

    # Delete from project_assignees
    db.session.execute(
        project_assignees.delete().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    )

    # Delete from project_assignment
    ProjectAssignment.query.filter_by(
        project_id=project_id,
        user_id=user.id
    ).delete()

    db.session.commit()
    print(f"[SUCCESS] Removed EID={eid} from Project ID={project_id}")
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

@app.route('/api/user-info', methods=['GET'])
@jwt_required()
def user_info():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if user:
        return jsonify({
            "userName": user['name']  # or user.username depending on schema
        }), 200
    else:
        return jsonify({"error": "User not found"}), 404

# ------------------ Department Manager ------------------
@app.route('/api/dm-departments', methods=['GET'])
@jwt_required()
def get_managed_departments():
    user_id = get_jwt_identity()  # should return int or str user ID

    print("User ID from token:", user_id)

    # Get the user
    user = User.query.filter_by(id=user_id).first()
    print("Fetched User:", user)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != 'department_manager':
        print("Unauthorized role:", user.role)
        return jsonify({"error": "Unauthorized access"}), 403

    departments = Department.query.all()
    print(f"Found {len(departments)} departments in total.")

    result = []
    for dept in departments:
        manager_ids = []
        if hasattr(dept, 'managerIds') and dept.managerIds:
            manager_ids = [mid.strip() for mid in dept.managerIds.split(',')]
        elif dept.managerId:
            manager_ids = [dept.managerId]

        print(f"Dept {dept.did} managers: {manager_ids}")

        if user.eid in manager_ids:
            result.append({
                'did': dept.did,
                'name': dept.name,
                'oid': dept.oid,
                'managerId': dept.managerId,
                'managerIds': manager_ids,
            })

    print(f"Returning {len(result)} managed departments.")
    return jsonify(result), 200

@app.route('/api/dm-projects', methods=['GET'])
@jwt_required()
def get_projects_for_department_manager():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # If the user is a department manager, filter projects by their departments
    if user.role == 'department_manager':
        managed_departments = Department.query.filter_by(managerId=user.eid).all()
        department_ids = [d.did for d in managed_departments]

        if not department_ids:
            return jsonify([])

        projects = Project.query.filter(Project.departmentId.in_(department_ids)).all()
    else:
        # For other roles (e.g., admin), return all projects
        projects = Project.query.all()

    return jsonify([{
        "id": p.id,
        "name": p.name,
        "departmentId": p.departmentId,
        "startDate": p.startDate.strftime('%Y-%m-%d'),
        "endDate": p.endDate.strftime('%Y-%m-%d'),
        #"budget": p.budget,
        "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
    } for p in projects])

@app.route('/api/dm-project-budgets', methods=['GET'])
@jwt_required()
def get_dm_project_budgets():
    current_user_id = get_jwt_identity()

    user = User.query.filter_by(id=current_user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role != 'department_manager':
        return jsonify({'error': 'Unauthorized'}), 403

    departments = Department.query.filter_by(managerId=user.eid).all()
    department_ids = [d.did for d in departments]

    if not department_ids:
        return jsonify([]), 200

    # 🧠 Fetch revenue, cost and compute margin per project
    results = (
        db.session.query(
            Project.name,
            func.coalesce(func.sum(ProjectAssignment.cost), 0).label("revenue"),
            func.coalesce(func.sum(ProjectAssignment.actual_cost), 0).label("actual_cost")
        )
        .join(ProjectAssignment, Project.id == ProjectAssignment.project_id)
        .filter(Project.departmentId.in_(department_ids))
        .group_by(Project.name)
        .all()
    )

    return jsonify([
        {
            "name": name,
            "cost": float(revenue),  # frontend expects revenue under 'cost'
            "actual_cost": float(actual_cost),  # real cost
            "margin": float(revenue) - float(actual_cost)
        } for name, revenue, actual_cost in results
    ]), 200


@app.route('/api/department-projects', methods=['GET'])
@jwt_required()
def department_project_summary():
    import json  # To log JSON response properly in console

    user_id = get_jwt_identity()

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != 'department_manager':
        return jsonify({"error": "Unauthorized"}), 403

    departments = Department.query.filter_by(managerId=user.eid).all()
    if not departments:
        return jsonify([]), 200

    result = []
    for dept in departments:
        projects = Project.query.filter_by(departmentId=dept.did).all()
        if not projects:
            continue

        project_ids = [p.id for p in projects]

        # Aggregate revenue and actual cost
        cost_data = (
            db.session.query(
                func.coalesce(func.sum(ProjectAssignment.cost), 0),            # revenue
                func.coalesce(func.sum(ProjectAssignment.actual_cost), 0)      # actual cost
            )
            .filter(ProjectAssignment.project_id.in_(project_ids))
            .first()
        )

        total_revenue = float(cost_data[0])
        total_cost = float(cost_data[1])
        total_profit = total_revenue - total_cost

        project_list = [{
            "id": p.id,
            "name": p.name,
            "startDate": p.startDate.strftime('%Y-%m-%d'),
            "endDate": p.endDate.strftime('%Y-%m-%d'),
            "createdAt": p.createdAt.isoformat() if p.createdAt else None,
            "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
        } for p in projects]

        result.append({
            "departmentId": dept.did,
            "departmentName": dept.name,
            "projects": project_list,
            "cost": total_revenue,           # shown as Revenue in frontend
            "actual_cost": total_cost,       # shown as Cost in frontend
            "profit": total_profit           # shown as Profit in frontend
        })


    return jsonify(result), 200

# -----------------FY----------------------
@app.route('/api/projects/by-fy', methods=['GET'])
@jwt_required()
def get_projects_by_date_range():
    start_str = request.args.get('startDate')
    end_str = request.args.get('endDate')

    if not start_str or not end_str:
        return jsonify({'error': 'Missing startDate or endDate'}), 400

    try:
        fy_start = datetime.strptime(start_str, "%Y-%m-%d")
        fy_end = datetime.strptime(end_str, "%Y-%m-%d")

        projects = Project.query.filter(
            Project.endDate >= fy_start,
            Project.startDate <= fy_end
        ).all()

        return jsonify([{
            "id": p.id,
            "name": p.name,
            "departmentId": p.departmentId,
            "startDate": p.startDate.isoformat() if p.startDate else None,
            "endDate": p.endDate.isoformat() if p.endDate else None,
        } for p in projects])

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@app.route('/api/sum-projects-by-fy', methods=['GET'])
@jwt_required()
def get_projects_summary_by_fy():
    start_str = request.args.get('startDate')
    end_str = request.args.get('endDate')

    if not start_str or not end_str:
        return jsonify({'error': 'Missing startDate or endDate'}), 400

    try:
        fy_start = datetime.strptime(start_str, "%Y-%m-%d")
        fy_end = datetime.strptime(end_str, "%Y-%m-%d")

        # Query projects overlapping FY
        project_data = (
            db.session.query(
                Project.id,
                Project.name,
                Project.departmentId,
                Project.startDate,
                Project.endDate,
                Project.createdAt,
                Project.updatedAt,
                func.coalesce(func.sum(ProjectAssignment.cost), 0).label("total_cost"),
                func.coalesce(func.sum(ProjectAssignment.actual_cost), 0).label("actual_cost")
            )
            .outerjoin(ProjectAssignment, Project.id == ProjectAssignment.project_id)
            .filter(
                and_(
                    Project.endDate >= fy_start,
                    Project.startDate <= fy_end
                )
            )
            .group_by(Project.id)
            .all()
        )

        return jsonify([
            {
                "id": p.id,
                "name": p.name,
                "cost": float(p.total_cost),
                "actual_cost": float(p.actual_cost),
                "margin": float(p.total_cost) - float(p.actual_cost),
                "departmentId": p.departmentId,
                "startDate": p.startDate.strftime('%Y-%m-%d') if p.startDate else None,
                "endDate": p.endDate.strftime('%Y-%m-%d') if p.endDate else None,
                "createdAt": p.createdAt.isoformat() if p.createdAt else None,
                "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
            }
            for p in project_data
        ]), 200

    except Exception as e:
        print("🔴 Error in /api/sum-projects-by-fy:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
@app.route('/api/project-budgets-by-fy', methods=['GET'])
@jwt_required()
def get_project_budgets_by_fy():
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')

        print(f"📥 Received FY range: start={start_date}, end={end_date}")

        if not start_date or not end_date:
            print("⚠️ Missing date range in query params")
            return jsonify({"error": "Missing date range"}), 400

        # Query projects active in the given FY range
        projects = (
            db.session.query(
                Project.id,
                Project.name,
                func.coalesce(func.sum(ProjectAssignment.cost), 0).label('revenue'),
                func.coalesce(func.sum(ProjectAssignment.actual_cost), 0).label('actual_cost')
            )
            .outerjoin(ProjectAssignment, Project.id == ProjectAssignment.project_id)
            .filter(Project.startDate <= end_date, Project.endDate >= start_date)
            .group_by(Project.id)
            .all()
        )

        print(f"✅ Found {len(projects)} projects in date range")

        result = []
        for p in projects:
            revenue = float(p.revenue)
            actual_cost = float(p.actual_cost)
            margin = revenue - actual_cost

            print(f"➡️ Project: {p.name}, Revenue: {revenue}, Cost: {actual_cost}, Margin: {margin}")

            result.append({
                "id": p.id,
                "name": p.name,
                "cost": revenue,  # revenue stored under 'cost' for frontend
                "actual_cost": actual_cost,
                "margin": margin
            })

        return jsonify(result), 200

    except Exception as e:
        print("❌ Error in /api/project-budgets-by-fy:", e)
        return jsonify({"error": "Internal Server Error"}), 500


@app.route('/api/sum-projects', methods=['GET'])
@jwt_required()
def get_projects_summary():
    try:
        # Step 1: Get all project IDs
        results = db.session.query(Project.id).all()
        project_ids = [row[0] for row in results]

        if not project_ids:
            return jsonify([]), 200

        # Step 2: Get project financials
        project_data = (
            db.session.query(
                Project.id,
                Project.name,
                Project.departmentId,
                Project.startDate,
                Project.endDate,
                Project.createdAt,
                Project.updatedAt,
                func.coalesce(func.sum(ProjectAssignment.cost), 0).label("total_cost"),
                func.coalesce(func.sum(ProjectAssignment.actual_cost), 0).label("actual_cost")
            )
            .outerjoin(ProjectAssignment, Project.id == ProjectAssignment.project_id)
            .filter(Project.id.in_(project_ids))
            .group_by(Project.id)
            .all()
        )

        # Step 3: Format and return response
        return jsonify([
            {
                "id": p.id,
                "name": p.name,
                "cost": float(p.total_cost),
                "actual_cost": float(p.actual_cost),
                "margin": float(p.total_cost) - float(p.actual_cost),
                "departmentId": p.departmentId,
                "startDate": p.startDate.strftime('%Y-%m-%d') if p.startDate else None,
                "endDate": p.endDate.strftime('%Y-%m-%d') if p.endDate else None,
                "createdAt": p.createdAt.isoformat() if p.createdAt else None,
                "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
            }
            for p in project_data
        ]), 200

    except Exception as e:
        print("🔴 Error in /api/sum-projects:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    

@app.route('/api/projects-by-pm', methods=['GET'])
@jwt_required()
def get_projects_by_project_manager():
    try:
        # Alias tables for clarity
        pa = aliased(project_assignees)

        results = (
            db.session.query(
                User.id.label("user_id"),
                func.concat(User.fname, ' ', User.lname).label("name"),
                Project.id.label("project_id"),
                Project.name.label("project_name"),
                Project.departmentId,
                Project.startDate,
                Project.endDate,
                func.sum(ProjectAssignment.cost).label("cost"),
                func.sum(ProjectAssignment.actual_cost).label("actual_cost")
            )
            # Join with ProjectAssignees table to filter for PMs
            .join(pa, and_(pa.c.user_id == User.id, pa.c.role == 'Project Manager'))
            .join(Project, Project.id == pa.c.project_id)
            .join(ProjectAssignment, and_(
                ProjectAssignment.project_id == Project.id,
                ProjectAssignment.user_id == User.id
            ))
            .group_by(
                User.id, User.fname, User.lname,
                Project.id, Project.name, Project.departmentId,
                Project.startDate, Project.endDate
            )
            .all()
        )

        # Group by project manager
        grouped = {}
        for row in results:
            if row.user_id not in grouped:
                grouped[row.user_id] = {
                    "project_manager": {
                        "eid": row.user_id,
                        "name": row.name
                    },
                    "projects": []
                }
            grouped[row.user_id]["projects"].append({
                "id": row.project_id,
                "name": row.project_name,
                "departmentId": row.departmentId,
                "startDate": str(row.startDate),
                "endDate": str(row.endDate),
                "cost": float(row.cost or 0),
                "actual_cost": float(row.actual_cost or 0)
            })

        return jsonify(list(grouped.values())), 200

    except Exception as e:
        print("🔴 Error in /api/projects-by-pm:", str(e))
        import traceback; traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/monthwise-report', methods=['GET'])
@jwt_required()
def get_monthwise_report():
    from sqlalchemy import extract

    view = request.args.get('view', 'org')
    id_filter = request.args.get('id')

    def empty_months():
        return {i: {"revenue": 0, "cost": 0, "margin": 0} for i in range(1, 13)}

    def calculate_totals(monthly_data):
        return {
            "revenue": sum(m["revenue"] for m in monthly_data.values()),
            "cost": sum(m["cost"] for m in monthly_data.values()),
            "margin": sum(m["margin"] for m in monthly_data.values())
        }

    result = {}

    if view == 'proj':
        # Project-level single project summary
        query = db.session.query(
            Project.id.label("project_id"),
            Project.name.label("project_name"),
            extract('month', ProjectAssignment.start_date).label("month"),
            func.sum(ProjectAssignment.cost).label("revenue"),
            func.sum(ProjectAssignment.actual_cost).label("cost")
        ).join(ProjectAssignment, Project.id == ProjectAssignment.project_id)

        if id_filter:
            query = query.filter(Project.id == id_filter)

        query = query.group_by("project_id", "project_name", "month").all()

        for row in query:
            pid = row.project_id
            month = int(row.month)
            revenue = row.revenue or 0
            cost = row.cost or 0
            margin = revenue - cost

            if pid not in result:
                result[pid] = {
                    "project_name": row.project_name,
                    "monthly": empty_months(),
                    "total": {"revenue": 0, "cost": 0, "margin": 0}
                }

            result[pid]["monthly"][month]["revenue"] += revenue
            result[pid]["monthly"][month]["cost"] += cost
            result[pid]["monthly"][month]["margin"] += margin

        for proj in result.values():
            proj["total"] = calculate_totals(proj["monthly"])

    elif view == 'org':
        # Organisation-level grouped by project
        projects = Project.query.all()

        for proj in projects:
            query = db.session.query(
                extract('month', ProjectAssignment.start_date).label("month"),
                func.sum(ProjectAssignment.cost).label("revenue"),
                func.sum(ProjectAssignment.actual_cost).label("cost")
            ).filter(ProjectAssignment.project_id == proj.id).group_by("month").all()

            result[proj.id] = {
                "project_name": proj.name,
                "monthly": empty_months(),
                "total": {"revenue": 0, "cost": 0, "margin": 0}
            }

            for row in query:
                month = int(row.month)
                revenue = row.revenue or 0
                cost = row.cost or 0
                margin = revenue - cost

                result[proj.id]["monthly"][month]["revenue"] += revenue
                result[proj.id]["monthly"][month]["cost"] += cost
                result[proj.id]["monthly"][month]["margin"] += margin

            result[proj.id]["total"] = calculate_totals(result[proj.id]["monthly"])

    elif view == 'dept':
        # Department-level view with each dept's summary and its projects
        departments = Department.query.all()

        for dept in departments:
            dept_data = {
                "department_name": dept.name,
                "monthly": empty_months(),
                "total": {"revenue": 0, "cost": 0, "margin": 0},
                "projects": {}
            }

            dept_projects = Project.query.filter_by(departmentId=dept.did).all()

            for proj in dept_projects:
                query = db.session.query(
                    extract('month', ProjectAssignment.start_date).label("month"),
                    func.sum(ProjectAssignment.cost).label("revenue"),
                    func.sum(ProjectAssignment.actual_cost).label("cost")
                ).filter(ProjectAssignment.project_id == proj.id).group_by("month").all()

                proj_monthly = empty_months()

                for row in query:
                    month = int(row.month)
                    revenue = row.revenue or 0
                    cost = row.cost or 0
                    margin = revenue - cost

                    proj_monthly[month]["revenue"] += revenue
                    proj_monthly[month]["cost"] += cost
                    proj_monthly[month]["margin"] += margin

                    # Add to department totals
                    dept_data["monthly"][month]["revenue"] += revenue
                    dept_data["monthly"][month]["cost"] += cost
                    dept_data["monthly"][month]["margin"] += margin

                dept_data["projects"][proj.id] = {
                    "project_name": proj.name,
                    "monthly": proj_monthly,
                    "total": calculate_totals(proj_monthly)
                }

            dept_data["total"] = calculate_totals(dept_data["monthly"])
            result[dept.did] = dept_data

    return jsonify(result), 200


    
# ------------------ MAIN ------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)

