from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("MYSQL_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # Import models to register with SQLAlchemy
    from app.models.user import User
    from app.models.project import Project
    from app.models.department import Department
    from app.models.organisation import Organisation
    from app.models.activity_log import ActivityLog
    from app.models.financials import EmployeeFinancials
    from app.models.assignments import ProjectAssignment
    from app.models.association import project_assignees
    from app.models.financial_year import FinancialYear


    # Register routes
    from app.routes import register_routes
    register_routes(app)

    # Create tables if they do not exist
    with app.app_context():
        db.create_all()

    return app
