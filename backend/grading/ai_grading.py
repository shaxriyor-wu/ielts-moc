"""
AI-powered Writing Grading using OpenAI API or similar services.
"""

import os
import json
from decimal import Decimal


def grade_writing_task_ai(task_number: int, student_response: str, task_prompt: str = None) -> dict:
    """
    Grade a writing task using AI (OpenAI GPT-4, Claude, etc.).
    
    Args:
        task_number: 1 or 2
        student_response: Student's written response
        task_prompt: The task prompt/question (optional, for context)
        
    Returns:
        dict: Dictionary with band scores and breakdown
    """
    # Check if AI API key is configured
    api_key = os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
    
    if not api_key:
        # Fallback: Return placeholder scores if AI is not configured
        return {
            'task_score': None,
            'breakdown': {
                'task_achievement': None,
                'coherence_cohesion': None,
                'lexical_resource': None,
                'grammatical_range': None,
            },
            'feedback': 'AI grading not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.',
            'ai_used': False,
        }
    
    # Determine assessment criteria based on task number
    if task_number == 1:
        criteria = """
        Task Achievement (0-9):
        - Addresses all parts of the task
        - Presents a clear overview of main trends, differences or stages
        - Clearly presents and highlights key features/figures
        
        Coherence and Cohesion (0-9):
        - Logically organizes information and ideas
        - Uses cohesive devices effectively
        - Presents a clear central topic within each paragraph
        
        Lexical Resource (0-9):
        - Uses a sufficient range of vocabulary
        - Uses less common vocabulary with awareness of style
        - Makes only rare errors in spelling and word formation
        
        Grammatical Range and Accuracy (0-9):
        - Uses a variety of complex structures
        - Produces frequent error-free sentences
        - Has good control of grammar and punctuation
        """
    else:  # Task 2
        criteria = """
        Task Response (0-9):
        - Addresses all parts of the task
        - Presents a clear position throughout
        - Develops ideas with relevant, extended and supported ideas
        
        Coherence and Cohesion (0-9):
        - Sequences information and ideas logically
        - Manages all aspects of cohesion well
        - Uses paragraphing sufficiently and appropriately
        
        Lexical Resource (0-9):
        - Uses a wide range of vocabulary with very natural control
        - Uses less common lexical items with awareness of style
        - Makes only rare minor errors
        
        Grammatical Range and Accuracy (0-9):
        - Uses a wide range of structures with full flexibility
        - Produces consistently accurate complex sentences
        - Has excellent control of grammar and punctuation
        """
    
    # Prepare AI prompt
    prompt = f"""
    You are an expert IELTS Writing examiner. Evaluate the following student response according to official IELTS criteria.

    TASK {task_number} PROMPT:
    {task_prompt or 'Not provided'}

    STUDENT RESPONSE:
    {student_response}

    ASSESSMENT CRITERIA:
    {criteria}

    Please evaluate the response and provide:
    1. Task Achievement/Task Response score (0-9, in 0.5 increments)
    2. Coherence and Cohesion score (0-9, in 0.5 increments)
    3. Lexical Resource score (0-9, in 0.5 increments)
    4. Grammatical Range and Accuracy score (0-9, in 0.5 increments)
    5. Overall Task {task_number} band score (average of the four criteria, rounded to nearest 0.5)

    Respond in JSON format:
    {{
        "task_achievement": <score>,
        "coherence_cohesion": <score>,
        "lexical_resource": <score>,
        "grammatical_range": <score>,
        "overall_score": <score>,
        "feedback": "<brief feedback>"
    }}
    """
    
    try:
        # Try OpenAI first
        if os.getenv('OPENAI_API_KEY'):
            return grade_with_openai(prompt)
        # Try Anthropic Claude
        elif os.getenv('ANTHROPIC_API_KEY'):
            return grade_with_anthropic(prompt)
        else:
            raise ValueError("No AI API key configured")
    except Exception as e:
        # Fallback scoring based on word count and basic analysis
        return fallback_grading(task_number, student_response)


def grade_with_openai(prompt: str) -> dict:
    """Grade using OpenAI GPT-4."""
    try:
        import openai
        
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert IELTS Writing examiner. Always respond in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
        )
        
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        
        return {
            'task_score': float(result.get('overall_score', 0)),
            'breakdown': {
                'task_achievement': float(result.get('task_achievement', 0)),
                'coherence_cohesion': float(result.get('coherence_cohesion', 0)),
                'lexical_resource': float(result.get('lexical_resource', 0)),
                'grammatical_range': float(result.get('grammatical_range', 0)),
            },
            'feedback': result.get('feedback', ''),
            'ai_used': True,
        }
    except ImportError:
        return fallback_grading(1, "")
    except Exception as e:
        print(f"OpenAI grading error: {e}")
        return fallback_grading(1, "")


def grade_with_anthropic(prompt: str) -> dict:
    """Grade using Anthropic Claude."""
    try:
        import anthropic
        
        client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
        
        result_text = message.content[0].text
        result = json.loads(result_text)
        
        return {
            'task_score': float(result.get('overall_score', 0)),
            'breakdown': {
                'task_achievement': float(result.get('task_achievement', 0)),
                'coherence_cohesion': float(result.get('coherence_cohesion', 0)),
                'lexical_resource': float(result.get('lexical_resource', 0)),
                'grammatical_range': float(result.get('grammatical_range', 0)),
            },
            'feedback': result.get('feedback', ''),
            'ai_used': True,
        }
    except ImportError:
        return fallback_grading(1, "")
    except Exception as e:
        print(f"Anthropic grading error: {e}")
        return fallback_grading(1, "")


def fallback_grading(task_number: int, student_response: str) -> dict:
    """
    Fallback grading when AI is not available.
    Uses basic heuristics based on word count and simple analysis.
    """
    if not student_response:
        return {
            'task_score': 0.0,
            'breakdown': {
                'task_achievement': 0.0,
                'coherence_cohesion': 0.0,
                'lexical_resource': 0.0,
                'grammatical_range': 0.0,
            },
            'feedback': 'No response provided.',
            'ai_used': False,
        }
    
    # Remove HTML tags and count words
    import re
    plain_text = re.sub(r'<[^>]+>', ' ', student_response)
    word_count = len(plain_text.split())
    
    # Basic scoring based on word count and structure
    # This is a very basic fallback - AI grading is strongly recommended
    min_words = 150 if task_number == 1 else 250
    
    if word_count < min_words * 0.5:
        base_score = 3.0
    elif word_count < min_words * 0.75:
        base_score = 4.5
    elif word_count < min_words:
        base_score = 5.5
    elif word_count < min_words * 1.5:
        base_score = 6.5
    else:
        base_score = 7.0
    
    return {
        'task_score': round(base_score * 2) / 2,  # Round to nearest 0.5
        'breakdown': {
            'task_achievement': round(base_score * 2) / 2,
            'coherence_cohesion': round(base_score * 2) / 2,
            'lexical_resource': round(base_score * 2) / 2,
            'grammatical_range': round(base_score * 2) / 2,
        },
        'feedback': f'Fallback grading based on word count ({word_count} words). AI grading recommended for accurate assessment.',
        'ai_used': False,
    }

