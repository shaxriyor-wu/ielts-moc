from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import json
import uuid
from datetime import datetime

bp = Blueprint('results', __name__, url_prefix='/api/results')

DB_DIR = 'data'
os.makedirs(DB_DIR, exist_ok=True)

def load_results():
    filepath = os.path.join(DB_DIR, 'results.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_results(results):
    filepath = os.path.join(DB_DIR, 'results.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

@bp.route('', methods=['GET'])
@jwt_required()
def get_results():
    user_id = get_jwt_identity()
    results = load_results()
    user_results = [r for r in results if r['userId'] == user_id]
    return jsonify(user_results), 200

@bp.route('/<attempt_id>', methods=['GET'])
@jwt_required()
def get_result(attempt_id):
    user_id = get_jwt_identity()
    results = load_results()
    result = next((r for r in results if r['attemptId'] == attempt_id and r['userId'] == user_id), None)
    
    if not result:
        return jsonify({'message': 'Result not found'}), 404
    
    return jsonify(result), 200

