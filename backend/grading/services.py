"""
Grading services for answer checking and AI-powered writing evaluation.
"""

from decimal import Decimal
from student_portal.models import StudentTest, TestResult, TestResponse
from exams.models import Answer, Variant
from .ielts_conversion import listening_band_score, reading_band_score
from .ai_grading import grade_writing_task_ai


def grade_reading_listening(student_test: StudentTest) -> dict:
    """
    Grade Reading and Listening sections by comparing student answers with correct answers.
    Uses official IELTS band score conversion tables.
    
    Returns:
        dict: Dictionary with scores and breakdown for reading and listening
    """
    variant = student_test.variant
    responses = TestResponse.objects.filter(
        student_test=student_test,
        section__in=['reading', 'listening']
    )
    
    correct_answers = Answer.objects.filter(variant=variant)
    
    results = {
        'reading': {
            'correct': 0,
            'total': 0,
            'score': None,
            'breakdown': {},
            'question_results': {}  # Track which questions were correct/incorrect
        },
        'listening': {
            'correct': 0,
            'total': 0,
            'score': None,
            'breakdown': {},
            'question_results': {}
        },
    }
    
    # Count correct answers for each section
    for answer in correct_answers:
        section = answer.section
        student_response = responses.filter(
            section=section,
            question_number=answer.question_number
        ).first()
        
        # Always increment total for the section if a correct answer exists (part of the test)
        results[section]['total'] += 1
        
        if student_response:
            
            # Prepare student answer
            student_answer = str(student_response.answer).strip()
            
            # Prepare correct answers (main + alternatives)
            correct_options = [str(answer.correct_answer).strip()]
            if answer.alternative_answers:
                if isinstance(answer.alternative_answers, list):
                    correct_options.extend([str(a).strip() for a in answer.alternative_answers])
            
            # Check if answer is correct (supports case-insensitive matching)
            is_correct = False
            if answer.case_sensitive:
                # Case-sensitive matching
                is_correct = student_answer in correct_options
            else:
                # Case-insensitive matching
                student_answer_normalized = student_answer.upper()
                correct_options_normalized = [opt.upper() for opt in correct_options]
                is_correct = student_answer_normalized in correct_options_normalized
            
            if is_correct:
                results[section]['correct'] += 1
            
            # Track individual question results
            results[section]['question_results'][answer.question_number] = {
                'correct': is_correct,
                'student_answer': student_response.answer,  # Original answer
                'correct_answer': answer.correct_answer,
                'alternative_answers': answer.alternative_answers
            }
    
    # Calculate IELTS band scores using official conversion tables
    if results['listening']['total'] > 0:
        raw_score = results['listening']['correct']
        band_score = listening_band_score(raw_score)
        results['listening']['score'] = float(band_score)
        results['listening']['breakdown'] = {
            'correct': results['listening']['correct'],
            'total': results['listening']['total'],
            'raw_score': raw_score,
            'band_score': band_score,
            'question_results': results['listening']['question_results'],
        }
    
    if results['reading']['total'] > 0:
        raw_score = results['reading']['correct']
        band_score = reading_band_score(raw_score, academic=True)
        results['reading']['score'] = float(band_score)
        results['reading']['breakdown'] = {
            'correct': results['reading']['correct'],
            'total': results['reading']['total'],
            'raw_score': raw_score,
            'band_score': band_score,
            'question_results': results['reading']['question_results'],
        }
    
    return results


def grade_writing(student_test: StudentTest) -> dict:
    """
    Grade Writing section using AI-powered evaluation.
    Grades Task 1 and Task 2 separately, then calculates overall writing score.
    
    Returns:
        dict: Dictionary with writing scores and breakdown
    """
    writing_responses = TestResponse.objects.filter(
        student_test=student_test,
        section='writing'
    )
    
    task1_response = writing_responses.filter(question_number=1).first()
    task2_response = writing_responses.filter(question_number=2).first()
    
    # Get task prompts from variant files (if available)
    from exams.models import TestFile
    variant = student_test.variant
    task1_file = TestFile.objects.filter(variant=variant, file_type='writing', task_number=1).first()
    task2_file = TestFile.objects.filter(variant=variant, file_type='writing', task_number=2).first()
    
    task1_prompt = None  # Could extract from file if needed
    task2_prompt = None
    
    result = {
        'task1_score': None,
        'task2_score': None,
        'overall_score': None,
        'task1_breakdown': None,
        'task2_breakdown': None,
    }
    
    # Grade Task 1
    if task1_response:
        print(f"DEBUG: Found Task 1 response: {task1_response.answer[:50]}...")
        task1_result = grade_writing_task_ai(1, task1_response.answer, task1_prompt)
        result['task1_score'] = task1_result['task_score']
        result['task1_breakdown'] = task1_result['breakdown']
        result['task1_feedback'] = task1_result.get('feedback', '')
        result['task1_detailed_feedback'] = task1_result.get('detailed_feedback', '')
    else:
        print("DEBUG: No Task 1 response found in DB")
    
    # Grade Task 2
    if task2_response:
        print(f"DEBUG: Found Task 2 response: {task2_response.answer[:50]}...")
        task2_result = grade_writing_task_ai(2, task2_response.answer, task2_prompt)
        result['task2_score'] = task2_result['task_score']
        result['task2_breakdown'] = task2_result['breakdown']
        result['task2_feedback'] = task2_result.get('feedback', '')
        result['task2_detailed_feedback'] = task2_result.get('detailed_feedback', '')
    
    # Calculate overall writing score
    scores = []
    if result['task1_score'] is not None:
        scores.append(result['task1_score'])
    if result['task2_score'] is not None:
        scores.append(result['task2_score'])
    
    if scores:
        # Average and round to nearest 0.5
        avg_score = sum(scores) / len(scores)
        result['overall_score'] = round(avg_score * 2) / 2
    else:
        result['overall_score'] = None
    
    return result


def grade_test(student_test: StudentTest) -> TestResult:
    """
    Grade a complete test (all sections).
    
    Args:
        student_test: StudentTest instance to grade
        
    Returns:
        TestResult: Created or updated TestResult instance
    """
    if student_test.status != 'submitted':
        raise ValueError("Test must be submitted before grading")
    
    # Grade Reading and Listening
    reading_listening_results = grade_reading_listening(student_test)
    
    # Grade Writing
    writing_results = grade_writing(student_test)
    
    # Create or update TestResult
    result, created = TestResult.objects.get_or_create(
        student_test=student_test,
        defaults={
            'listening_score': reading_listening_results['listening']['score'],
            'reading_score': reading_listening_results['reading']['score'],
            'writing_score': writing_results['overall_score'],
            'writing_task1_score': writing_results['task1_score'],
            'writing_task2_score': writing_results['task2_score'],
            'listening_breakdown': reading_listening_results['listening'].get('breakdown'),
            'reading_breakdown': reading_listening_results['reading'].get('breakdown'),
            'writing_breakdown': {
                'task1': writing_results.get('task1_breakdown'),
                'task2': writing_results.get('task2_breakdown'),
                'task1_feedback': writing_results.get('task1_feedback'),
                'task2_feedback': writing_results.get('task2_feedback'),
                'task1_detailed_feedback': writing_results.get('task1_detailed_feedback'),
                'task2_detailed_feedback': writing_results.get('task2_detailed_feedback'),
            },
            'graded_by': None,  # Automated grading
        }
    )
    
    if not created:
        # Update existing result
        result.listening_score = reading_listening_results['listening']['score']
        result.reading_score = reading_listening_results['reading']['score']
        result.writing_score = writing_results['overall_score']
        result.writing_task1_score = writing_results['task1_score']
        result.writing_task2_score = writing_results['task2_score']
        result.listening_breakdown = reading_listening_results['listening'].get('breakdown')
        result.reading_breakdown = reading_listening_results['reading'].get('breakdown')
        result.writing_breakdown = {
            'task1': writing_results.get('task1_breakdown'),
            'task2': writing_results.get('task2_breakdown'),
            'task1_feedback': writing_results.get('task1_feedback'),
            'task2_feedback': writing_results.get('task2_feedback'),
            'task1_detailed_feedback': writing_results.get('task1_detailed_feedback'),
            'task2_detailed_feedback': writing_results.get('task2_detailed_feedback'),
        }
        result.save()
    
    # Calculate overall score
    result.calculate_overall_score()
    
    # Update test status
    student_test.status = 'graded'
    student_test.save()
    
    return result

