### app/utils/jwt_utils.py
from flask_jwt_extended import create_access_token
from datetime import timedelta

def generate_token(user):
    token = create_access_token(identity=user.id, expires_delta=timedelta(days=1))
    return token


def token_required(fn):
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)

    return wrapper