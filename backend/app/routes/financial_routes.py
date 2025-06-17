### app/routes/financial_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.models.financials import EmployeeFinancials
from app import db

fin_bp = Blueprint("financial", __name__, url_prefix="/api/employee-financials")

@fin_bp.route('', methods=['GET'])
@jwt_required()
def get_employee_financials():
    financial_year = request.args.get('year')
    if not financial_year:
        return jsonify({"error": "Financial year parameter is required"}), 400

    users = User.query.all()
    result = []
    for user in users:
        financial = EmployeeFinancials.query.filter_by(eid=user.eid).first()
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

@fin_bp.route('/<eid>', methods=['POST'])
@jwt_required()
def update_employee_financials(eid):
    data = request.get_json()
    salary = data.get("salary")
    infrastructure = data.get("infrastructure")
    financial_year = data.get("financial_year")
    if not financial_year:
        return jsonify({"error": "Financial year is required"}), 400

    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    financial = EmployeeFinancials.query.filter_by(eid=eid).first()
    if not financial:
        financial = EmployeeFinancials(eid=eid)
        db.session.add(financial)

    financial.salary = salary
    financial.infrastructure = infrastructure
    db.session.commit()

    return jsonify({"message": "Financial data updated"}), 200
