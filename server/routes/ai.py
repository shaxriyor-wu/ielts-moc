from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import requests
import json
import re
from datetime import datetime

bp = Blueprint('ai', __name__, url_prefix='/api')

DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

DB_DIR = 'data'
os.makedirs(DB_DIR, exist_ok=True)

def load_writing_results():
    filepath = os.path.join(DB_DIR, 'writing_results.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_writing_results(results):
    filepath = os.path.join(DB_DIR, 'writing_results.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

def parse_ai_response(response_text):
    """Parse DeepSeek AI response to extract band scores and feedback"""
    scores = {
        'TaskResponse': None,
        'CoherenceCohesion': None,
        'LexicalResource': None,
        'GrammarRangeAccuracy': None,
        'OverallBand': None,
        'Feedback': ''
    }

    # Try to extract scores using regex
    patterns = {
        'TaskResponse': r'(?:Task\s*Response|Task\s*Achievement)[:\s]*([0-9.]+)',
        'CoherenceCohesion': r'(?:Coherence\s*[&\s]*Cohesion|Coherence)[:\s]*([0-9.]+)',
        'LexicalResource': r'(?:Lexical\s*Resource|Vocabulary)[:\s]*([0-9.]+)',
        'GrammarRangeAccuracy': r'(?:Grammar\s*[&\s]*Accuracy|Grammar)[:\s]*([0-9.]+)',
        'OverallBand': r'(?:Overall\s*Band|Band\s*Score|Total)[:\s]*([0-9.]+)',
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, response_text, re.IGNORECASE)
        if match:
            try:
                scores[key] = float(match.group(1))
            except:
                pass

    # Extract feedback (everything after scores or general feedback)
    feedback_match = re.search(r'(?:Feedback|Comments?|Notes?)[:\s]*(.+?)(?:\n\n|\Z)', response_text, re.IGNORECASE | re.DOTALL)
    if feedback_match:
        scores['Feedback'] = feedback_match.group(1).strip()
    else:
        # If no explicit feedback section, use the whole response
        scores['Feedback'] = response_text

    # If OverallBand not found, calculate average
    if scores['OverallBand'] is None:
        valid_scores = [v for v in [
            scores['TaskResponse'],
            scores['CoherenceCohesion'],
            scores['LexicalResource'],
            scores['GrammarRangeAccuracy']
        ] if v is not None]
        if valid_scores:
            scores['OverallBand'] = round(sum(valid_scores) / len(valid_scores), 1)

    return scores

@bp.route('/evaluate-writing', methods=['POST'])
@jwt_required()
def evaluate_writing():
    if not DEEPSEEK_API_KEY:
        return jsonify({'message': 'DeepSeek API key not configured'}), 500

    data = request.get_json()
    text = data.get('text')
    task_number = data.get('task', 1)  # 1 or 2
    user_id = get_jwt_identity()

    if not text:
        return jsonify({'message': 'Text is required'}), 400

    # Prepare prompt for DeepSeek
    system_prompt = """You are an official IELTS Writing Examiner. Evaluate the following IELTS Writing Task {} essay according to the official IELTS band descriptors.

Provide your assessment in the following format:

Task Response: [band score 0-9]
Coherence and Cohesion: [band score 0-9]
Lexical Resource: [band score 0-9]
Grammar Range and Accuracy: [band score 0-9]
Overall Band: [calculated average, rounded to nearest 0.5]

Feedback: [Detailed feedback explaining strengths and areas for improvement]

Be strict but fair. Use half bands (e.g., 6.5, 7.0, 7.5).""".format(task_number)

    try:
        # Call DeepSeek API
        headers = {
            'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
            'Content-Type': 'application/json'
        }

        payload = {
            'model': 'deepseek-chat',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': text}
            ],
            'temperature': 0.2,
            'max_tokens': 1000
        }

        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        ai_response = response.json()
        ai_text = ai_response['choices'][0]['message']['content']

        # Parse the response
        scores = parse_ai_response(ai_text)

        # Save result
        result = {
            'id': str(uuid.uuid4()),
            'userId': user_id,
            'task': task_number,
            'text': text,
            'scores': scores,
            'evaluatedAt': datetime.now().isoformat(),
            'aiResponse': ai_text
        }

        results = load_writing_results()
        results.append(result)
        save_writing_results(results)

        return jsonify({
            'success': True,
            'scores': scores,
            'evaluationId': result['id']
        }), 200

    except requests.exceptions.RequestException as e:
        return jsonify({
            'message': 'Failed to connect to DeepSeek API',
            'error': str(e)
        }), 500
    except Exception as e:
        return jsonify({
            'message': 'Error processing evaluation',
            'error': str(e)
        }), 500

@bp.route('/writing-results', methods=['GET'])
@jwt_required()
def get_writing_results():
    user_id = get_jwt_identity()
    results = load_writing_results()
    user_results = [r for r in results if r['userId'] == user_id]
    return jsonify(user_results), 200

