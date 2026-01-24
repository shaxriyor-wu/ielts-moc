"""
AI-powered Speaking Grading using Claude API or similar services.
"""

import os
import json
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)


SPEAKING_EVALUATION_PROMPT = """You are an expert IELTS Speaking examiner with 15+ years of experience. Evaluate this IELTS Speaking response according to official IELTS band descriptors.

## EVALUATION CRITERIA (Each scored 0-9)

### 1. Fluency and Coherence (FC)
- Speech rate and continuity
- Use of discourse markers and connectives
- Logical sequencing of ideas
- Hesitation patterns (natural vs. unnatural)
- Self-correction ability

### 2. Lexical Resource (LR)
- Range of vocabulary
- Precision of word choice
- Use of idiomatic expressions
- Paraphrasing ability
- Topic-specific vocabulary

### 3. Grammatical Range and Accuracy (GRA)
- Sentence structure variety
- Accuracy of grammar
- Use of complex structures
- Error frequency and impact

### 4. Pronunciation (P)
- Inferred from text patterns: natural phrasing, contractions, connected speech indicators
- Word stress patterns evident in transcription
- Overall intelligibility based on sentence structure

---

## PART-SPECIFIC EVALUATION

### Part 1 (Interview)
- Expects SHORT, DIRECT answers (2-4 sentences per question)
- Natural conversation style
- Personal and relevant responses

### Part 2 (Long Turn)
- EXTENDED monologue (1-2 minutes)
- Must cover ALL bullet points
- Clear structure (introduction, body, conclusion)
- Cohesive devices essential

### Part 3 (Discussion)
- DEVELOPED answers with explanations and examples
- Ability to discuss abstract ideas
- Critical thinking and opinion justification
- More complex vocabulary and grammar expected

---

## INPUT DATA

**Part {part_number}**
**Topic:** {topic}
**Question(s):** {questions}

**Student's Transcribed Response:**
{student_response}

---

## REQUIRED OUTPUT FORMAT

### BAND SCORE BREAKDOWN
- **Fluency and Coherence:** X.0/9
- **Lexical Resource:** X.0/9
- **Grammatical Range and Accuracy:** X.0/9
- **Pronunciation:** X.0/9
- **OVERALL BAND:** X.0/9

### DETAILED ANALYSIS

#### Fluency and Coherence
[Specific observations]

#### Lexical Resource
- **Strong vocabulary:** [examples]
- **Improvements needed:** [with corrections]

#### Grammatical Range and Accuracy
- **Correct complex structures:** [examples]
- **Errors found:** [with corrections]

#### Pronunciation Assessment
[Based on text patterns indicating natural speech]

### SPECIFIC FEEDBACK

#### Strengths:
1. [Point 1]
2. [Point 2]

#### Priority Improvements:
1. [Improvement 1 with example]
2. [Improvement 2 with example]

#### Model Answer Excerpt:
[Brief Band 8-9 example response]

---

IMPORTANT: End with this exact JSON format:
```json
{{
    "fluency_coherence": 0.0,
    "lexical_resource": 0.0,
    "grammatical_range": 0.0,
    "pronunciation": 0.0,
    "overall_score": 0.0,
    "feedback": "Brief performance summary"
}}
```"""


def grade_speaking_part_ai(
    part_number: int,
    topic: str,
    questions: list,
    student_response: str
) -> dict:
    """
    Grade a speaking part using AI (Claude, GPT-4, etc.).

    Args:
        part_number: 1, 2, or 3
        topic: Topic/theme of the part
        questions: List of questions asked
        student_response: Transcribed text from student's audio

    Returns:
        dict: {
            'overall_score': float,
            'breakdown': {
                'fluency_coherence': float,
                'lexical_resource': float,
                'grammatical_range': float,
                'pronunciation': float
            },
            'feedback': str,
            'detailed_feedback': str,
            'ai_used': bool
        }
    """
    # Check if AI API keys are configured
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    groq_api_key = os.getenv('GROQ_API_KEY')
    google_api_key = os.getenv('GOOGLE_API_KEY')
    openai_api_key = os.getenv('OPENAI_API_KEY')

    if not any([anthropic_api_key, groq_api_key, google_api_key, openai_api_key]):
        logger.error("No AI API key configured for speaking grading")
        return {
            'overall_score': None,
            'breakdown': {
                'fluency_coherence': None,
                'lexical_resource': None,
                'grammatical_range': None,
                'pronunciation': None,
            },
            'feedback': 'AI grading not configured. Please set ANTHROPIC_API_KEY, GOOGLE_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY.',
            'detailed_feedback': '',
            'ai_used': False,
        }

    # Format questions
    if isinstance(questions, list):
        questions_text = '\n'.join([f"{i+1}. {q}" for i, q in enumerate(questions)])
    else:
        questions_text = str(questions)

    # Build the prompt
    prompt = SPEAKING_EVALUATION_PROMPT.format(
        part_number=part_number,
        topic=topic,
        questions=questions_text,
        student_response=student_response
    )

    try:
        # Try Claude (Anthropic) first - best for detailed evaluation
        if anthropic_api_key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=anthropic_api_key)

                message = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2048,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )

                response_text = message.content[0].text
                logger.info(f"Successfully graded speaking Part {part_number} using Claude")

            except ImportError:
                logger.warning("Anthropic library not installed, trying alternatives")
                response_text = None
            except Exception as e:
                logger.error(f"Claude API error: {str(e)}")
                response_text = None

        # Try Google Gemini (free tier available)
        elif google_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=google_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')

                response = model.generate_content(prompt)
                response_text = response.text
                logger.info(f"Successfully graded speaking Part {part_number} using Gemini")

            except ImportError:
                logger.warning("Google GenerativeAI library not installed, trying alternatives")
                response_text = None
            except Exception as e:
                logger.error(f"Gemini API error: {str(e)}")
                response_text = None

        # Try OpenAI GPT-4
        elif openai_api_key:
            try:
                import openai
                client = openai.OpenAI(api_key=openai_api_key)

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an expert IELTS Speaking examiner."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=2048
                )

                response_text = response.choices[0].message.content
                logger.info(f"Successfully graded speaking Part {part_number} using OpenAI")

            except ImportError:
                logger.warning("OpenAI library not installed, trying alternatives")
                response_text = None
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                response_text = None

        # Try Groq (free tier available)
        elif groq_api_key:
            try:
                import groq
                client = groq.Groq(api_key=groq_api_key)

                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are an expert IELTS Speaking examiner."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=2048
                )

                response_text = response.choices[0].message.content
                logger.info(f"Successfully graded speaking Part {part_number} using Groq")

            except ImportError:
                logger.warning("Groq library not installed")
                response_text = None
            except Exception as e:
                logger.error(f"Groq API error: {str(e)}")
                response_text = None

        else:
            response_text = None

        if not response_text:
            raise Exception("All AI services failed or are not configured properly")

        # Extract JSON from response
        scores = extract_scores_from_response(response_text)

        return {
            'overall_score': scores.get('overall_score'),
            'breakdown': {
                'fluency_coherence': scores.get('fluency_coherence'),
                'lexical_resource': scores.get('lexical_resource'),
                'grammatical_range': scores.get('grammatical_range'),
                'pronunciation': scores.get('pronunciation'),
            },
            'feedback': scores.get('feedback', 'No feedback provided'),
            'detailed_feedback': response_text,
            'ai_used': True,
        }

    except Exception as e:
        logger.error(f"Error grading speaking Part {part_number}: {str(e)}")
        return {
            'overall_score': None,
            'breakdown': {
                'fluency_coherence': None,
                'lexical_resource': None,
                'grammatical_range': None,
                'pronunciation': None,
            },
            'feedback': f'AI grading failed: {str(e)}',
            'detailed_feedback': '',
            'ai_used': False,
        }


def extract_scores_from_response(response_text: str) -> dict:
    """
    Extract JSON scores from AI response.

    Args:
        response_text: AI response containing JSON

    Returns:
        dict: Extracted scores
    """
    try:
        # Look for JSON code block
        import re
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)

        if json_match:
            json_str = json_match.group(1)
            scores = json.loads(json_str)
            return scores

        # Try to find JSON anywhere in the text
        json_match = re.search(r'\{[^{}]*"fluency_coherence"[^{}]*\}', response_text, re.DOTALL)
        if json_match:
            scores = json.loads(json_match.group(0))
            return scores

        logger.warning("Could not extract JSON from AI response")
        return {
            'fluency_coherence': None,
            'lexical_resource': None,
            'grammatical_range': None,
            'pronunciation': None,
            'overall_score': None,
            'feedback': 'Could not parse AI response'
        }

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'fluency_coherence': None,
            'lexical_resource': None,
            'grammatical_range': None,
            'pronunciation': None,
            'overall_score': None,
            'feedback': f'JSON parsing failed: {str(e)}'
        }


def calculate_speaking_overall_score(part_scores: list) -> float:
    """
    Calculate overall speaking score from part scores.

    Args:
        part_scores: List of part scores (floats)

    Returns:
        float: Overall speaking band score (rounded to nearest 0.5)
    """
    if not part_scores:
        return None

    valid_scores = [s for s in part_scores if s is not None]

    if not valid_scores:
        return None

    # Average the scores
    avg_score = sum(valid_scores) / len(valid_scores)

    # Round to nearest 0.5
    rounded_score = round(avg_score * 2) / 2

    return rounded_score
