from app import db

class FinancialYear(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(20), nullable=False, unique=True)  # e.g., "2024-2025"

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
        }
