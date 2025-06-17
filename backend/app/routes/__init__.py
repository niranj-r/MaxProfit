from .auth import auth_bp
from .user_routes import user_bp
from .department_routes import dept_bp
from .organisation_routes import org_bp
from .project_routes import proj_bp
from .assignee_routes import assignee_bp
from .financial_routes import fin_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(dept_bp)
    app.register_blueprint(org_bp)
    app.register_blueprint(proj_bp)
    app.register_blueprint(assignee_bp)
    app.register_blueprint(fin_bp)
