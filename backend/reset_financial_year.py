from app import create_app, db
from app.models.financial_year import FinancialYear

app = create_app()

with app.app_context():
    print("Dropping financial_year table...")
    FinancialYear.__table__.drop(db.engine)
    print("Creating all tables...")
    db.create_all()
    print("Done.")
