from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DB_DIR = 'data'
os.makedirs(DB_DIR, exist_ok=True)

def load_users():
    filepath = os.path.join(DB_DIR, 'users.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_users(users):
    filepath = os.path.join(DB_DIR, 'users.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400

    users = load_users()
    if any(u['email'] == email for u in users):
        return jsonify({'message': 'Email already exists'}), 400

    new_user = {
        'id': str(len(users) + 1),
        'name': name,
        'email': email,
        'password': generate_password_hash(password),
        'role': 'student',
        'createdAt': str(datetime.now())
    }

    users.append(new_user)
    save_users(users)

    access_token = create_access_token(identity=new_user['id'])
    user_data = {k: v for k, v in new_user.items() if k != 'password'}

    return jsonify({
        'token': access_token,
        'user': user_data
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    users = load_users()
    user = next((u for u in users if u['email'] == email), None)

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=user['id'])
    user_data = {k: v for k, v in user.items() if k != 'password'}

    return jsonify({
        'token': access_token,
        'user': user_data
    }), 200

@bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    users = load_users()
    user = next((u for u in users if u['id'] == user_id), None)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    user_data = {k: v for k, v in user.items() if k != 'password'}
    return jsonify(user_data), 200

