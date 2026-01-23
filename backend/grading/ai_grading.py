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
    # Check if AI API key is configured (prioritize free Groq/Gemini API)
    groq_api_key = os.getenv('GROQ_API_KEY')
    google_api_key = os.getenv('GOOGLE_API_KEY')
    openai_api_key = os.getenv('OPENAI_API_KEY')
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    
    if not any([groq_api_key, google_api_key, openai_api_key, anthropic_api_key]):
        # Fallback: Return placeholder scores if AI is not configured
        return {
            'task_score': None,
            'breakdown': {
                'task_achievement': None,
                'coherence_cohesion': None,
                'lexical_resource': None,
                'grammatical_range': None,
            },
            'feedback': 'AI grading not configured. Please set GOOGLE_API_KEY (free), OPENAI_API_KEY, or ANTHROPIC_API_KEY.',
            'ai_used': False,
        }
    
    # Count words in response
    import re
    plain_text = re.sub(r'<[^>]+>', ' ', student_response) if student_response else ''
    word_count = len(plain_text.split())
    
    # Prepare comprehensive AI prompt based on task number
    if task_number == 1:
        prompt = f"""You are an expert IELTS examiner with 10+ years of experience. Evaluate this IELTS Writing Task 1 response according to official IELTS band descriptors.

**Task Question:** {task_prompt or 'Not provided'}

**Student's Answer:** {student_response}

**Word Count:** {word_count}

---

## Provide detailed assessment in this structure:

### 1. BAND SCORE BREAKDOWN
- **Task Achievement:** X/9 
- **Coherence and Cohesion:** X/9
- **Lexical Resource:** X/9
- **Grammatical Range and Accuracy:** X/9
- **OVERALL BAND:** X/9

### 2. TASK ACHIEVEMENT (Detailed Analysis)
- Overview statement quality (present/absent/clear/vague)
- Key features coverage (what's included, what's missing)
- Data accuracy and relevance
- Appropriate length and detail

### 3. COHERENCE AND COHESION
- Paragraph structure
- Logical flow
- Linking devices usage

### 4. LEXICAL RESOURCE
- Vocabulary range and accuracy
- Errors with corrections

### 5. GRAMMATICAL RANGE AND ACCURACY
- Sentence structure variety
- Grammar errors with corrections

### 6. SPECIFIC RECOMMENDATIONS
1. [Improvement 1]
2. [Improvement 2]

### 7. MODEL SENTENCE IMPROVEMENTS
**Original:** [Problem sentence]
**Improved:** [Correction]
**Explanation:** [Why]

---

IMPORTANT: Also respond with a JSON block at the end in this exact format:
```json
{{
    "task_achievement": 0.0,
    "coherence_cohesion": 0.0,
    "lexical_resource": 0.0,
    "grammatical_range": 0.0,
    "overall_score": 0.0,
    "feedback": "Short summary string"
}}
```
"""
    else:  # Task 2
        prompt = f"""You are an expert IELTS examiner with 10+ years of experience. Evaluate this IELTS Writing Task 2 response according to official IELTS band descriptors.

**Essay Question:** {task_prompt or 'Not provided'}

**Student's Answer:** {student_response}

**Word Count:** {word_count}

---

## Provide detailed assessment in this structure:

### 1. BAND SCORE BREAKDOWN
- **Task Response:** X/9
- **Coherence and Cohesion:** X/9
- **Lexical Resource:** X/9
- **Grammatical Range and Accuracy:** X/9
- **OVERALL BAND:** X/9

### 2. TASK RESPONSE (Detailed Analysis)
- Position/opinion clarity
- Ideas development and support
- Conclusion effectiveness

### 3. COHERENCE AND COHESION
- Essay Structure (Intro/Body/Conclusion)
- Logical flow and linking

### 4. LEXICAL RESOURCE
- Vocabulary sophistication and accuracy
- Errors with corrections

### 5. GRAMMATICAL RANGE AND ACCURACY
- Complex structures usage
- Grammar errors with corrections

### 6. PRIORITY IMPROVEMENTS
1. [Improvement 1]
2. [Improvement 2]

### 7. DETAILED SENTENCE CORRECTIONS
**Original:** [Problem sentence]
**Corrected:** [Better version]
**Reason:** [Why]

---

IMPORTANT: Also respond with a JSON block at the end in this exact format:
```json
{{
    "task_achievement": 0.0,
    "coherence_cohesion": 0.0,
    "lexical_resource": 0.0,
    "grammatical_range": 0.0,
    "overall_score": 0.0,
    "feedback": "Short summary string"
}}
```
"""
    
    print(f"DEBUG: Grading Task {task_number}, Length: {len(student_response) if student_response else 0}, Words: {word_count}")
    
    try:
        # Try Groq first (Free and fast)
        if os.getenv('GROQ_API_KEY'):
            return grade_with_groq(prompt)
        # Try Google Gemini second (Free tier available)
        elif os.getenv('GOOGLE_API_KEY'):
            return grade_with_gemini(prompt)
        # Try OpenAI as third option
        elif os.getenv('OPENAI_API_KEY'):
            return grade_with_openai(prompt)
        # Try Anthropic Claude as fourth option
        elif os.getenv('ANTHROPIC_API_KEY'):
            return grade_with_anthropic(prompt)
        else:
            # No AI configured, use fallback
            return fallback_grading(task_number, student_response)
    except Exception as e:
        print(f"AI grading error: {e}")
        # Fallback scoring based on word count and basic analysis
        return fallback_grading(task_number, student_response)


def grade_with_gemini(prompt: str) -> dict:
    """Grade using Google Gemini (FREE API tier available)."""
    try:
        from google import genai
        import re
        
        # Create client with API key
        client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))
        
        # Generate response using gemini-2.0-flash (free tier)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        result_text = response.text
        
        # Extract detailed feedback (everything before the JSON block)
        detailed_feedback = ""
        json_data = {}
        
        # Try to find JSON block in the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result_text)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                # Get everything before the JSON block as detailed feedback
                detailed_feedback = result_text[:json_match.start()].strip()
            except json.JSONDecodeError:
                try:
                    json_data = json.loads(result_text)
                except:
                    pass
        else:
            try:
                json_data = json.loads(result_text)
            except:
                detailed_feedback = result_text
        
        return {
            'task_score': float(json_data.get('overall_score', 0)),
            'breakdown': {
                'task_achievement': float(json_data.get('task_achievement', 0)),
                'coherence_cohesion': float(json_data.get('coherence_cohesion', 0)),
                'lexical_resource': float(json_data.get('lexical_resource', 0)),
                'grammatical_range': float(json_data.get('grammatical_range', 0)),
            },
            'feedback': json_data.get('feedback', ''),
            'detailed_feedback': detailed_feedback,
            'ai_used': True,
        }
    except ImportError as e:
        print(f"google-genai library not installed: {e}")
        return fallback_grading(1, "")
    except Exception as e:
        print(f"Gemini grading error: {e}")
        return fallback_grading(1, "")


def grade_with_groq(prompt: str) -> dict:
    """Grade using Groq API (FREE and Fast)."""
    try:
        from groq import Groq
        import re
        
        client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert IELTS Writing examiner. Provide detailed markdown feedback followed by a JSON block with scores."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=4000,
        )
        
        result_text = completion.choices[0].message.content
        
        # Extract detailed feedback (everything before the JSON block)
        detailed_feedback = ""
        json_data = {}
        
        # Try to find JSON block in the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result_text)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                # Get everything before the JSON block as detailed feedback
                detailed_feedback = result_text[:json_match.start()].strip()
            except json.JSONDecodeError:
                try:
                    json_data = json.loads(result_text)
                except:
                    pass
        else:
            try:
                json_data = json.loads(result_text)
            except:
                detailed_feedback = result_text
        
        return {
            'task_score': float(json_data.get('overall_score', 0)),
            'breakdown': {
                'task_achievement': float(json_data.get('task_achievement', 0)),
                'coherence_cohesion': float(json_data.get('coherence_cohesion', 0)),
                'lexical_resource': float(json_data.get('lexical_resource', 0)),
                'grammatical_range': float(json_data.get('grammatical_range', 0)),
            },
            'feedback': json_data.get('feedback', ''),
            'detailed_feedback': detailed_feedback,
            'ai_used': True,
        }
    except ImportError:
        print("groq library not installed")
        raise  # Re-raise to let parent handle usage of other providers or fallback
    except Exception as e:
        print(f"Groq grading error: {e}")
        raise  # Re-raise so grade_writing_task_ai catches it and uses original student_response for fallback


def grade_with_huggingface_gpt2(prompt: str, task_number: int, student_response: str) -> dict:
    """
    Grade using Hugging Face GPT-2 (FREE API).
    
    Note: GPT-2 is a text generator, not designed for evaluation.
    Results may not be consistent. This is a fallback option when
    paid APIs (GPT-3.5/4, Claude) are not available.
    """
    try:
        import requests
        
        api_token = os.getenv('HUGGINGFACE_API_TOKEN')
        api_url = "https://api-inference.huggingface.co/models/gpt2"
        
        headers = {"Authorization": f"Bearer {api_token}"}
        
        # Simplify prompt for GPT-2 (it has limited capacity)
        simplified_prompt = f"Evaluate this IELTS Writing Task {task_number} essay. Give 4 scores (0-9): Task Achievement, Coherence, Vocabulary, Grammar. Essay: {student_response[:500]}..."
        
        response = requests.post(
            api_url,
            headers=headers,
           json={"inputs": simplified_prompt, "parameters": {"max_new_tokens": 150}},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # GPT-2 returns generated text, we need to parse it
            # This is highly unreliable - use with caution
            generated_text = result[0]['generated_text'] if isinstance(result, list) else result.get('generated_text', '')
            
            # Try to extract scores (very basic parsing)
            # Since GPT-2 isn't designed for this, we'll use fallback with a note
            print(f"GPT-2 response: {generated_text}")
            
            # Use fallback scoring but mark that AI was attempted
            result = fallback_grading(task_number, student_response)
            result['feedback'] += "\n\nNote: Evaluated using GPT-2 (limited capabilities). For accurate grading, configure GPT-3.5/4 or Claude API."
            result['ai_used'] = 'gpt2'
            return result
        else:
            print(f"Hugging Face API error: {response.status_code} - {response.text}")
            return fallback_grading(task_number, student_response)
            
    except ImportError:
        print("requests library not installed")
        return fallback_grading(task_number, student_response)
    except Exception as e:
        print(f"Hugging Face grading error: {e}")
        return fallback_grading(task_number, student_response)


def grade_with_openai(prompt: str) -> dict:
    """Grade using OpenAI GPT-4."""
    try:
        import openai
        import re
        
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert IELTS Writing examiner. Provide detailed markdown feedback followed by a JSON block with scores."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4000,
        )
        
        result_text = response.choices[0].message.content
        
        # Extract detailed feedback (everything before the JSON block)
        detailed_feedback = ""
        json_data = {}
        
        # Try to find JSON block in the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result_text)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                # Get everything before the JSON block as detailed feedback
                detailed_feedback = result_text[:json_match.start()].strip()
            except json.JSONDecodeError:
                # If JSON parsing fails, try to parse the entire response
                try:
                    json_data = json.loads(result_text)
                except:
                    pass
        else:
            # No JSON block found, try to parse entire response as JSON
            try:
                json_data = json.loads(result_text)
            except:
                # If all fails, use the entire response as feedback
                detailed_feedback = result_text
        
        return {
            'task_score': float(json_data.get('overall_score', 0)),
            'breakdown': {
                'task_achievement': float(json_data.get('task_achievement', 0)),
                'coherence_cohesion': float(json_data.get('coherence_cohesion', 0)),
                'lexical_resource': float(json_data.get('lexical_resource', 0)),
                'grammatical_range': float(json_data.get('grammatical_range', 0)),
            },
            'feedback': json_data.get('feedback', ''),
            'detailed_feedback': detailed_feedback,
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
        import re
        
        client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
        
        result_text = message.content[0].text
        
        # Extract detailed feedback (everything before the JSON block)
        detailed_feedback = ""
        json_data = {}
        
        # Try to find JSON block in the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result_text)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                # Get everything before the JSON block as detailed feedback
                detailed_feedback = result_text[:json_match.start()].strip()
            except json.JSONDecodeError:
                try:
                    json_data = json.loads(result_text)
                except:
                    pass
        else:
            try:
                json_data = json.loads(result_text)
            except:
                detailed_feedback = result_text
        
        return {
            'task_score': float(json_data.get('overall_score', 0)),
            'breakdown': {
                'task_achievement': float(json_data.get('task_achievement', 0)),
                'coherence_cohesion': float(json_data.get('coherence_cohesion', 0)),
                'lexical_resource': float(json_data.get('lexical_resource', 0)),
                'grammatical_range': float(json_data.get('grammatical_range', 0)),
            },
            'feedback': json_data.get('feedback', ''),
            'detailed_feedback': detailed_feedback,
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

