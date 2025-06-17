### app/utils/helpers.py
from app import db
from app.models.activity_log import ActivityLog
from datetime import datetime

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