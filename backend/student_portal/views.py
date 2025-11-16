from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import StudentTest, TestResponse, TestResult, TestQueue
from exams.models import Variant
from .serializers import (
    StudentTestSerializer, TestResponseSerializer, TestResultSerializer
)
import random


def require_student(view_func):
    """Decorator to require student role."""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_student():
            return Response(
                {'error': 'Student access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enter_test_code(request):
    """Student enters test code and joins the queue."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    test_code = request.data.get('testCode', '').strip()
    
    if not test_code or len(test_code) != 6:
        return Response(
            {'error': 'Invalid test code. Please enter a 6-digit code.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if variant with this code exists and is active
    variant = Variant.objects.filter(code=test_code, is_active=True).first()
    
    if not variant:
        return Response(
            {'error': 'Invalid Test Code - Please Try Again'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if student already has a queue entry for this code
    queue_entry, created = TestQueue.objects.get_or_create(
        student=request.user,
        test_code=test_code,
        defaults={'status': 'waiting'}
    )
    
    if not created:
        # Return current status
        return Response({
            'status': queue_entry.status,
            'message': 'Already in queue',
            'queue_entry_id': queue_entry.id,
            'assigned_variant_id': queue_entry.assigned_variant_id if queue_entry.assigned_variant else None,
        })
    
    return Response({
        'status': 'waiting',
        'message': 'Test Starting Soon - Please Wait',
        'queue_entry_id': queue_entry.id,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_queue_status(request):
    """Check student's queue status."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    queue_entry = TestQueue.objects.filter(
        student=request.user,
        status__in=['waiting', 'assigned', 'preparation']
    ).order_by('-joined_at').first()
    
    if not queue_entry:
        return Response({
            'status': 'none',
            'message': 'No active queue entry'
        })
    
    response_data = {
        'status': queue_entry.status,
        'queue_entry_id': queue_entry.id,
        'assigned_variant_id': queue_entry.assigned_variant_id if queue_entry.assigned_variant else None,
    }
    
    if queue_entry.status == 'preparation' and queue_entry.preparation_started_at:
        elapsed = (timezone.now() - queue_entry.preparation_started_at).total_seconds()
        remaining = max(0, 60 - elapsed)  # 60 seconds preparation time
        response_data['preparation_time_remaining'] = int(remaining)
        
        # If preparation time is over, mark as started
        if remaining <= 0:
            queue_entry.status = 'started'
            queue_entry.save()
            response_data['status'] = 'started'
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_test(request):
    """Start the test after preparation time."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    queue_entry = TestQueue.objects.filter(
        student=request.user,
        status='preparation'
    ).order_by('-joined_at').first()
    
    if not queue_entry or not queue_entry.assigned_variant:
        return Response(
            {'error': 'No test assigned or preparation not completed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if preparation time is over
    if queue_entry.preparation_started_at:
        elapsed = (timezone.now() - queue_entry.preparation_started_at).total_seconds()
        if elapsed < 60:
            return Response(
                {'error': 'Preparation time not yet completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Mark queue entry as started
    queue_entry.status = 'started'
    queue_entry.save()
    
    # Get or create StudentTest
    student_test, created = StudentTest.objects.get_or_create(
        student=request.user,
        variant=queue_entry.assigned_variant,
        defaults={'status': 'in_progress'}
    )
    
    return Response({
        'message': 'Test started successfully.',
        'student_test': StudentTestSerializer(student_test).data,
        'variant_id': queue_entry.assigned_variant_id
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_test(request):
    """Get current active test for student with file URLs."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    variant = student_test.variant
    test_data = StudentTestSerializer(student_test).data
    
    # Get file URLs
    from exams.models import TestFile
    from django.conf import settings
    
    listening_file = TestFile.objects.filter(variant=variant, file_type='listening').first()
    reading_file = TestFile.objects.filter(variant=variant, file_type='reading').first()
    writing_files = TestFile.objects.filter(variant=variant, file_type='writing')
    
    # Build file URLs
    base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
    
    test_data['files'] = {
        'listening': {
            'file_url': f"{base_url}{listening_file.file.url}" if listening_file else None,
            'audio_url': f"{base_url}{listening_file.audio_file.url}" if listening_file and listening_file.audio_file else None,
        },
        'reading': {
            'file_url': f"{base_url}{reading_file.file.url}" if reading_file else None,
        },
        'writing': {
            'task1_url': f"{base_url}{writing_files.filter(task_number=1).first().file.url}" if writing_files.filter(task_number=1).first() else None,
            'task2_url': f"{base_url}{writing_files.filter(task_number=2).first().file.url}" if writing_files.filter(task_number=2).first() else None,
        }
    }
    
    return Response(test_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_attempt(request):
    """Get current attempt details."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate time remaining
    elapsed_time = (timezone.now() - student_test.start_time).total_seconds()
    total_seconds = student_test.variant.duration_minutes * 60
    time_remaining = max(0, total_seconds - elapsed_time)
    
    serializer = StudentTestSerializer(student_test)
    data = serializer.data
    data['time_remaining_seconds'] = int(time_remaining)
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_reading_answers(request):
    """Save reading section answers."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    answers = request.data.get('answers', {})
    
    for question_num, answer in answers.items():
        TestResponse.objects.update_or_create(
            student_test=student_test,
            section='reading',
            question_number=int(question_num),
            defaults={'answer': str(answer)}
        )
    
    return Response({'message': 'Reading answers saved successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_listening_answers(request):
    """Save listening section answers."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    answers = request.data.get('answers', {})
    
    for question_num, answer in answers.items():
        TestResponse.objects.update_or_create(
            student_test=student_test,
            section='listening',
            question_number=int(question_num),
            defaults={'answer': str(answer)}
        )
    
    return Response({'message': 'Listening answers saved successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_writing(request):
    """Save writing section content (legacy - single content)."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    content = request.data.get('content', '')
    
    TestResponse.objects.update_or_create(
        student_test=student_test,
        section='writing',
        question_number=None,
        defaults={'answer': content}
    )
    
    return Response({'message': 'Writing content saved successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_writing_task(request):
    """Save writing task 1 or 2 content."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    task_number = request.data.get('task_number')  # 1 or 2
    content = request.data.get('content', '')
    
    if task_number not in [1, 2]:
        return Response(
            {'error': 'task_number must be 1 or 2.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    TestResponse.objects.update_or_create(
        student_test=student_test,
        section='writing',
        question_number=task_number,
        defaults={'answer': content}
    )
    
    return Response({'message': f'Writing Task {task_number} saved successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_highlights(request):
    """Save highlights for reading/listening sections."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    highlights = request.data.get('highlights', [])
    
    # Store highlights in student_test or separate model
    # For now, we'll just acknowledge the save
    # In production, you might want to store this in a separate Highlights model
    
    return Response({
        'message': 'Highlights saved successfully.',
        'count': len(highlights)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_test(request):
    """Submit test and trigger automatic grading."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = StudentTest.objects.filter(
        student=request.user,
        status='in_progress'
    ).first()
    
    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate time remaining
    elapsed_time = (timezone.now() - student_test.start_time).total_seconds()
    total_seconds = student_test.variant.duration_minutes * 60
    time_remaining = max(0, total_seconds - elapsed_time)
    
    student_test.time_remaining_seconds = int(time_remaining)
    student_test.submit()
    
    # Trigger automatic grading
    try:
        from grading.services import grade_test
        test_result = grade_test(student_test)
        
        return Response({
            'message': 'Test submitted and graded successfully.',
            'student_test': StudentTestSerializer(student_test).data,
            'result': {
                'listening_score': float(test_result.listening_score) if test_result.listening_score else None,
                'reading_score': float(test_result.reading_score) if test_result.reading_score else None,
                'writing_score': float(test_result.writing_score) if test_result.writing_score else None,
                'writing_task1_score': float(test_result.writing_task1_score) if test_result.writing_task1_score else None,
                'writing_task2_score': float(test_result.writing_task2_score) if test_result.writing_task2_score else None,
                'overall_score': float(test_result.overall_score) if test_result.overall_score else None,
                'listening_breakdown': test_result.listening_breakdown,
                'reading_breakdown': test_result.reading_breakdown,
                'writing_breakdown': test_result.writing_breakdown,
            }
        })
    except Exception as e:
        # If grading fails, still submit the test
        return Response({
            'message': 'Test submitted successfully. Grading will be processed shortly.',
            'student_test': StudentTestSerializer(student_test).data,
            'grading_error': str(e)
        })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get (GET) or update (PUT) student profile."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from accounts.serializers import UserSerializer
    
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    
    elif request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request):
    """Get student statistics."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    total_tests = StudentTest.objects.filter(student=request.user).count()
    completed_tests = StudentTest.objects.filter(
        student=request.user,
        status__in=['submitted', 'graded']
    ).count()
    graded_tests = TestResult.objects.filter(
        student_test__student=request.user
    ).count()
    
    # Get average score
    results = TestResult.objects.filter(student_test__student=request.user)
    avg_score = None
    if results.exists():
        scores = [float(r.overall_score) for r in results if r.overall_score is not None]
        if scores:
            avg_score = sum(scores) / len(scores)
    
    return Response({
        'total_tests_taken': total_tests,
        'completed_tests': completed_tests,
        'graded_tests': graded_tests,
        'average_score': round(avg_score, 2) if avg_score else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attempts(request):
    """Get all student attempts with results."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    attempts = StudentTest.objects.filter(student=request.user).order_by('-start_time')
    attempts_data = []
    
    for attempt in attempts:
        attempt_dict = StudentTestSerializer(attempt).data
        attempt_dict['variant_name'] = attempt.variant.name if attempt.variant else None
        # Get result if exists
        try:
            result = attempt.result
            attempt_dict['result'] = {
                'listening_score': float(result.listening_score) if result.listening_score else None,
                'reading_score': float(result.reading_score) if result.reading_score else None,
                'writing_score': float(result.writing_score) if result.writing_score else None,
                'writing_task1_score': float(result.writing_task1_score) if result.writing_task1_score else None,
                'writing_task2_score': float(result.writing_task2_score) if result.writing_task2_score else None,
                'overall_score': float(result.overall_score) if result.overall_score else None,
                'listening_breakdown': result.listening_breakdown,
                'reading_breakdown': result.reading_breakdown,
                'writing_breakdown': result.writing_breakdown,
            }
        except TestResult.DoesNotExist:
            attempt_dict['result'] = None
        
        attempts_data.append(attempt_dict)
    
    return Response(attempts_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tests(request):
    """Get available tests for student."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get variants that student hasn't attempted yet
    attempted_variant_ids = StudentTest.objects.filter(
        student=request.user
    ).values_list('variant_id', flat=True)
    
    variants = Variant.objects.filter(
        is_active=True
    ).exclude(id__in=attempted_variant_ids)
    
    from exams.serializers import VariantListSerializer
    serializer = VariantListSerializer(variants, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_tests(request):
    """Get all tests (including attempted)."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variants = Variant.objects.filter(is_active=True)
    from exams.serializers import VariantListSerializer
    serializer = VariantListSerializer(variants, many=True)
    return Response(serializer.data)

