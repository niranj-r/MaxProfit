import unittest
from app import app

class TestLogin(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_login_success(self):
        response = self.app.post('/api/login', json={
            "email": "sid@gmail.com",
            "password": "123456"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.get_json())

    def test_login_failure(self):
        response = self.app.post('/api/login', json={
            "email": "admin@example.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn("error", response.get_json())

if __name__ == "__main__":
    unittest.main()
