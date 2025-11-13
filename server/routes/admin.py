from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import json
import csv
import io
from datetime import datetime

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

DB_DIR = 'data'
os.makedirs(DB_DIR, exist_ok=True)

def load_users():
    filepath = os.path.join(DB_DIR, 'users.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def load_results():
    filepath = os.path.join(DB_DIR, 'results.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

@bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    # Check if user is admin
    user_id = get_jwt_identity()
    users = load_users()
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user or user.get('role') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Remove passwords
    safe_users = [{k: v for k, v in u.items() if k != 'password'} for u in users]
    return jsonify(safe_users), 200

@bp.route('/export', methods=['GET'])
@jwt_required()
def export_csv():
    user_id = get_jwt_identity()
    users = load_users()
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user or user.get('role') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    results = load_results()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Attempt ID', 'User ID', 'Test ID', 'Listening', 'Reading', 'Writing', 'Speaking', 'Date'])
    
    for result in results:
        writer.writerow([
            result.get('attemptId', ''),
            result.get('userId', ''),
            result.get('testId', ''),
            result.get('scores', {}).get('listening', ''),
            result.get('scores', {}).get('reading', ''),
            result.get('scores', {}).get('writing', ''),
            result.get('scores', {}).get('speaking', ''),
            result.get('submittedAt', '')
        ])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'ielts-results-{datetime.now().strftime("%Y%m%d")}.csv'
    )

@bp.route('/speaking/<attempt_id>', methods=['POST'])
@jwt_required()
def review_speaking(attempt_id):
    user_id = get_jwt_identity()
    users = load_users()
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user or user.get('role') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    speaking_score = data.get('speakingScore')
    feedback = data.get('feedback', '')
    
    # Update result
    results = load_results()
    result = next((r for r in results if r['attemptId'] == attempt_id), None)
    
    if not result:
        return jsonify({'message': 'Result not found'}), 404
    
    result['scores']['speaking'] = speaking_score
    result['speakingFeedback'] = feedback
    
    from routes.results import save_results
    save_results(results)
    
    return jsonify({'message': 'Speaking score updated'}), 200

