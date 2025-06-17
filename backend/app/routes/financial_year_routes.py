from flask import Blueprint, request, jsonify
from app import db
from app.models.financial_year import FinancialYear

financial_year_bp = Blueprint("financial_year_bp", __name__)

@financial_year_bp.route("/financial-years", methods=["GET"])
def get_financial_years():
    years = FinancialYear.query.all()
    return jsonify([year.to_dict() for year in years]), 200

@financial_year_bp.route("/financial-years", methods=["POST"])
def add_financial_year():
    data = request.get_json()
    start_year = data.get("start_year")

    if not isinstance(start_year, int):
        return jsonify({"error": "Invalid or missing start_year"}), 400

    label = f"{start_year}-{start_year + 1}"

    # Prevent duplicates
    if FinancialYear.query.filter_by(label=label).first():
        return jsonify({"error": "Financial year already exists"}), 400

    year = FinancialYear(label=label)
    db.session.add(year)
    db.session.commit()
    return jsonify(year.to_dict()), 201

@financial_year_bp.route("/financial-years/<int:id>", methods=["DELETE"])
def delete_financial_year(id):
    year = FinancialYear.query.get(id)
    if not year:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(year)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
