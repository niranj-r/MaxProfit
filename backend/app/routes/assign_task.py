from flask import Blueprint, request, jsonify
from app import db
from app.models.assignments import ProjectAssignment
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required

assign_task_bp = Blueprint('assign_task', __name__)

def working_days(start_date, end_date):
    total = 0
    curr = start_date
    while curr <= end_date:
        if curr.weekday() < 5:  # 0–4 are Mon–Fri
            total += 1
        curr += timedelta(days=1)
    return total

@assign_task_bp.route('/api/assign-task', methods=['POST'])
@jwt_required()
def assign_task():
    data = request.get_json()

    project_id = data.get('project_id')
    assignments = data.get('assignments', [])

    results = []

    for item in assignments:
        user_id = item.get('user_id')
        percentage = float(item.get('percentage', 0))
        billing_rate = float(item.get('billing_rate', 0))
        start_date_str = item.get('start_date')
        end_date_str = item.get('end_date')

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except Exception:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        days = working_days(start_date, end_date)
        cost = billing_rate * (percentage / 100.0) * days

        assignment = ProjectAssignment(
            user_id=user_id,
            project_id=project_id,
            allocated_percentage=percentage,
            billing_rate=billing_rate,
            cost=cost,
            start_date=start_date,
            end_date=end_date
        )
        db.session.add(assignment)
        results.append({
            "user_id": user_id,
            "cost": cost,
            "days": days
        })

    db.session.commit()
    return jsonify({"success": True, "assigned": results}), 201
