from app import create_app, db
from sqlalchemy import text

# Initialize app
app = create_app()

def clear_all_data():
    with app.app_context():
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        meta = db.metadata
        for table in reversed(meta.sorted_tables):
            db.session.execute(table.delete())
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()
        print("✅ All data cleared from all tables.")

# Run the function
clear_all_data()
