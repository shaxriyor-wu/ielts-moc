from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
import os
import json

bp = Blueprint('tests', __name__, url_prefix='/api/tests')

DB_DIR = 'data'
os.makedirs(DB_DIR, exist_ok=True)

def load_tests():
    filepath = os.path.join(DB_DIR, 'tests.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_tests(tests):
    filepath = os.path.join(DB_DIR, 'tests.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(tests, f, indent=2, ensure_ascii=False)

@bp.route('', methods=['GET'])
@jwt_required()
def get_tests():
    tests = load_tests()
    # Return only published tests
    published = [t for t in tests if t.get('published', False)]
    return jsonify(published), 200

@bp.route('/<test_id>', methods=['GET'])
@jwt_required()
def get_test(test_id):
    tests = load_tests()
    test = next((t for t in tests if t['id'] == test_id), None)
    
    if not test:
        return jsonify({'message': 'Test not found'}), 404
    
    return jsonify(test), 200

@bp.route('/<test_id>/submit', methods=['POST'])
@jwt_required()
def submit_test():
    user_id = get_jwt_identity()
    
    data = request.get_json()
    test_id = data.get('testId') or request.view_args.get('test_id')
    answers = data.get('answers', {})
    
    # Load answer keys and calculate scores
    tests = load_tests()
    test = next((t for t in tests if t['id'] == test_id), None)
    
    if not test:
        return jsonify({'message': 'Test not found'}), 404
    
    # Calculate scores (simplified)
    listening_score = 0
    reading_score = 0
    
    # Save result
    from routes.results import load_results, save_results
    results = load_results()
    
    result = {
        'attemptId': str(uuid.uuid4()),
        'userId': user_id,
        'testId': test_id,
        'answers': answers,
        'scores': {
            'listening': listening_score,
            'reading': reading_score,
            'writing': None,
            'speaking': None
        },
        'submittedAt': datetime.now().isoformat(),
        'status': 'completed'
    }
    
    results.append(result)
    save_results(results)
    
    return jsonify({
        'attemptId': result['attemptId'],
        'status': 'completed'
    }), 200

