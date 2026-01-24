from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from .models import StudentTest, TestResponse, TestResult, TestQueue, SpeakingResponse
from exams.models import Variant, TestFile
from .serializers import (
    StudentTestSerializer, TestResponseSerializer, TestResultSerializer
)

STATUS_LABELS = {
    'waiting': 'Waiting for activation',
    'assigned': 'Variant assigned',
    'preparation': 'Preparation in progress',
    'started': 'Test started',
    'timeout': 'Removed due to inactivity',
    'left': 'Left the queue',
}

STATUS_DESCRIPTIONS = {
    'waiting': 'Please stay ready. An administrator will start the mock shortly.',
    'assigned': 'Your variant has been assigned. Preparation timer will begin soon.',
    'preparation': 'Use this minute to prepare yourself before the test begins.',
    'started': 'Your test is live. You can proceed to the Listening section.',
    'timeout': 'You were removed because the test did not start within 10 minutes.',
    'left': 'You have left the queue manually.',
}


def serialize_queue_entry(queue_entry, *, include_student_test=False, student_test=None, extra=None):
    """Return a consistent payload for queue state."""
    if not queue_entry:
        return None

    now = timezone.now()

    data = {
        'queue_entry_id': queue_entry.id,
        'status': queue_entry.status,
        'status_label': STATUS_LABELS.get(queue_entry.status, queue_entry.status.title()),
        'status_description': STATUS_DESCRIPTIONS.get(queue_entry.status, ''),
        'test_code': queue_entry.test_code,
        'assigned_variant_id': queue_entry.assigned_variant_id,
        'assigned_variant_name': queue_entry.assigned_variant.name if queue_entry.assigned_variant else None,
        'joined_at': queue_entry.joined_at.isoformat() if queue_entry.joined_at else None,
        'assigned_at': queue_entry.assigned_at.isoformat() if queue_entry.assigned_at else None,
        'preparation_started_at': queue_entry.preparation_started_at.isoformat() if queue_entry.preparation_started_at else None,
        'started_at': queue_entry.started_at.isoformat() if getattr(queue_entry, 'started_at', None) else None,
        'timeout_at': queue_entry.timeout_at.isoformat() if queue_entry.timeout_at else None,
        'left_at': queue_entry.left_at.isoformat() if queue_entry.left_at else None,
    }

    if queue_entry.joined_at:
        wait_seconds = int((now - queue_entry.joined_at).total_seconds())
        wait_seconds = max(0, wait_seconds)
        data['waiting_duration_seconds'] = wait_seconds
        timeout_deadline = queue_entry.joined_at + timedelta(minutes=10)
        data['timeout_deadline'] = timeout_deadline.isoformat()

    if queue_entry.preparation_started_at:
        elapsed = (now - queue_entry.preparation_started_at).total_seconds()
        remaining = max(0, 60 - int(elapsed))
        data['preparation_time_remaining'] = remaining
        auto_start_at = queue_entry.preparation_started_at + timedelta(seconds=60)
        data['auto_start_at'] = auto_start_at.isoformat()
        data['can_start'] = remaining <= 0
    else:
        data['preparation_time_remaining'] = None
        data['auto_start_at'] = None
        data['can_start'] = False

    if queue_entry.assigned_variant_id and student_test is None:
        student_test = StudentTest.objects.filter(
            student=queue_entry.student,
            variant=queue_entry.assigned_variant
        ).first()

    if student_test:
        data['student_test_id'] = student_test.id
        data['student_test_status'] = student_test.status
        if include_student_test:
            data['student_test'] = StudentTestSerializer(student_test).data
    else:
        data['student_test_id'] = None
        data['student_test_status'] = None
        if include_student_test:
            data['student_test'] = None

    if extra:
        data.update(extra)

    return data


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
    
    # Check if variant with this code exists (doesn't need to be active yet)
    variant = Variant.objects.filter(code=test_code).first()
    
    if not variant:
        return Response(
            {'error': 'Invalid Test Code - Please Try Again'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    queue_entry, created = TestQueue.objects.get_or_create(
        student=request.user,
        test_code=test_code,
        defaults={'status': 'waiting'}
    )

    # Allow re-entry if previous attempt was completed/left/timeout
    if not created and queue_entry.status in ['left', 'timeout', 'started']:
        queue_entry.status = 'waiting'
        queue_entry.assigned_variant = None
        queue_entry.assigned_at = None
        queue_entry.preparation_started_at = None
        queue_entry.started_at = None
        queue_entry.left_at = None
        queue_entry.timeout_at = None
        queue_entry.joined_at = timezone.now()
        queue_entry.save(
            update_fields=[
                'status',
                'joined_at',
                'assigned_variant',
                'assigned_at',
                'preparation_started_at',
                'started_at',
                'left_at',
                'timeout_at',
            ]
        )
        created = True

    message = 'Already in queue' if not created else 'Test Starting Soon - Please Wait'

    # If variant is already active, assign immediately
    if variant.is_active and queue_entry.status == 'waiting':
        student_test, _ = StudentTest.objects.get_or_create(
            student=request.user,
            variant=variant,
            defaults={'status': 'in_progress'}
        )
        
        now = timezone.now()
        queue_entry.assigned_variant = variant
        queue_entry.status = 'preparation'
        queue_entry.assigned_at = now
        queue_entry.preparation_started_at = now
        queue_entry.save(
            update_fields=[
                'assigned_variant',
                'status',
                'assigned_at',
                'preparation_started_at'
            ]
        )
        
        payload = serialize_queue_entry(
            queue_entry,
            include_student_test=True,
            student_test=student_test,
            extra={'message': 'Test assigned. Preparation time starting.'}
        )
        return Response(payload)

    payload = serialize_queue_entry(
        queue_entry,
        extra={'message': message}
    )
    return Response(payload)


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
        status__in=['waiting', 'assigned', 'preparation', 'started']
    ).select_related('assigned_variant', 'student').order_by('-joined_at').first()
    
    if not queue_entry:
        return Response({
            'status': 'none',
            'message': 'No active queue entry'
        })
    
    # Check for timeout (10 minutes)
    joined_at = queue_entry.joined_at
    now = timezone.now()
    minutes_waiting = (now - joined_at).total_seconds() / 60
    
    if minutes_waiting >= 10 and queue_entry.status != 'started':
        queue_entry.status = 'timeout'
        queue_entry.timeout_at = now
        queue_entry.save()
        return Response({
            'status': 'timeout',
            'message': 'Test did not start within 10 minutes'
        })
    
    if queue_entry.status == 'preparation' and queue_entry.preparation_started_at:
        elapsed = (timezone.now() - queue_entry.preparation_started_at).total_seconds()
        if elapsed >= 60 and queue_entry.status != 'started':
            queue_entry.status = 'started'
            queue_entry.started_at = timezone.now()
            queue_entry.save(update_fields=['status', 'started_at'])
            if queue_entry.assigned_variant_id:
                StudentTest.objects.get_or_create(
                    student=request.user,
                    variant=queue_entry.assigned_variant,
                    defaults={'status': 'in_progress'}
                )

    payload = serialize_queue_entry(queue_entry)
    return Response(payload)


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
        status__in=['preparation', 'started']
    ).select_related('assigned_variant', 'student').order_by('-joined_at').first()
    
    if not queue_entry or not queue_entry.assigned_variant:
        return Response(
            {'error': 'No test assigned or preparation not completed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    student_test = None
    if queue_entry.assigned_variant_id:
        student_test = StudentTest.objects.filter(
            student=request.user,
            variant=queue_entry.assigned_variant
        ).first()
    
    # If already started, just return success
    if queue_entry.status == 'started':
        if not student_test and queue_entry.assigned_variant_id:
            student_test, _ = StudentTest.objects.get_or_create(
                student=request.user,
                variant=queue_entry.assigned_variant,
                defaults={'status': 'in_progress'}
            )
        payload = serialize_queue_entry(
            queue_entry,
            include_student_test=True,
            student_test=student_test,
            extra={'message': 'Test already started.'}
        )
        payload['variant_id'] = queue_entry.assigned_variant_id
        return Response(payload)
    
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
    queue_entry.started_at = timezone.now()
    queue_entry.save(update_fields=['status', 'started_at'])
    
    # Get or create StudentTest
    student_test = StudentTest.objects.filter(
        student=request.user,
        variant=queue_entry.assigned_variant
    ).first()

    if student_test:
        # User is re-entering after leaving or restarting
        # RESET all progress as per strict requirements
        student_test.responses.all().delete()
        student_test.status = 'in_progress'
        student_test.start_time = timezone.now()
        student_test.submission_time = None
        student_test.save()
    else:
        student_test = StudentTest.objects.create(
            student=request.user,
            variant=queue_entry.assigned_variant,
            status='in_progress'
        )
    
    payload = serialize_queue_entry(
        queue_entry,
        include_student_test=True,
        student_test=student_test,
        extra={'message': 'Test started successfully.'}
    )
    payload['variant_id'] = queue_entry.assigned_variant_id
    return Response(payload)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_queue(request):
    """Leave the test queue."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Find active queue entry
    queue_entry = TestQueue.objects.filter(
        student=request.user,
        status__in=['waiting', 'assigned', 'preparation']
    ).order_by('-joined_at').first()
    
    if not queue_entry:
        return Response({
            'success': True,
            'message': 'Not in queue'
        })
    
    # Check if test already started
    if queue_entry.status == 'started':
        return Response(
            {'error': 'Cannot leave - test already started'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark as left
    queue_entry.status = 'left'
    queue_entry.left_at = timezone.now()
    queue_entry.save()
    
    return Response({
        'success': True,
        'message': 'Left queue successfully'
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
        # Auto-recovery: If no in-progress test but queue is started, recover/create it
        queue_entry = TestQueue.objects.filter(
            student=request.user,
            status='started'
        ).order_by('-started_at').first()
        
        if queue_entry and queue_entry.assigned_variant:
            student_test = StudentTest.objects.filter(
                student=request.user,
                variant=queue_entry.assigned_variant
            ).first()
            
            if student_test:
                student_test.status = 'in_progress'
                student_test.save()
            else:
                student_test = StudentTest.objects.create(
                    student=request.user,
                    variant=queue_entry.assigned_variant,
                    status='in_progress'
                )

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
    
    # Build file URLs - Django FileField.url already returns the correct relative URL
    def build_media_url(file_field):
        """Build absolute URL for media file."""
        if not file_field:
            return None
        
        try:
            # Django FileField.url returns a URL that starts with MEDIA_URL
            # For example: '/media/test_files/2025/11/17/file.pdf'
            relative_url = file_field.url
            
            # Build absolute URL from the relative URL
            absolute_url = request.build_absolute_uri(relative_url)
            return absolute_url
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error building media URL for field {file_field}: {e}', exc_info=True)
            return None
    
    test_data['files'] = {
        'listening': {
            'file_url': build_media_url(listening_file.file if listening_file and listening_file.file else None),
            'audio_url': build_media_url(listening_file.audio_file if listening_file and listening_file.audio_file else None),
            'questions_data': listening_file.questions_data if listening_file else None,
            'duration_minutes': listening_file.duration_minutes if listening_file else None,
        },
        'reading': {
            'file_url': build_media_url(reading_file.file if reading_file and reading_file.file else None),
            'questions_data': reading_file.questions_data if reading_file else None,
            'duration_minutes': reading_file.duration_minutes if reading_file else None,
        },
        'writing': {
            'task1_url': build_media_url(writing_files.filter(task_number=1).first().file if writing_files.filter(task_number=1).first() else None),
            'task2_url': build_media_url(writing_files.filter(task_number=2).first().file if writing_files.filter(task_number=2).first() else None),
            'task1_data': writing_files.filter(task_number=1).first().questions_data if writing_files.filter(task_number=1).first() else None,
            'task2_data': writing_files.filter(task_number=2).first().questions_data if writing_files.filter(task_number=2).first() else None,
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
    
    with transaction.atomic():
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
    
    with transaction.atomic():
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
        
    if not student_test:
        # Check if it was recently submitted (race condition or retry)
        student_test = StudentTest.objects.filter(
            student=request.user,
            status__in=['submitted', 'graded']
        ).order_by('-submission_time').first()
        
        if student_test:
            # If already submitted, we can't save new content, but we should return 200 
            # to avoid client-side errors during "submit & save" chain
            return Response({'message': f'Test already submitted. Writing Task {task_number} not updated.'})
            
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
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
        # Check if already submitted
        student_test = StudentTest.objects.filter(
            student=request.user,
            status__in=['submitted', 'graded']
        ).order_by('-submission_time').first()
        
        if student_test:
            # Already submitted, return the result if available or just success
            # If graded, return result
            data = {
                'message': 'Test already submitted.',
                'student_test': StudentTestSerializer(student_test).data,
            }
            
            if hasattr(student_test, 'result'):
                test_result = student_test.result
                data['result'] = {
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
            
            return Response(data)

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
                'speaking_score': float(test_result.speaking_score) if test_result.speaking_score else None,
                'overall_score': float(test_result.overall_score) if test_result.overall_score else None,
                'listening_breakdown': test_result.listening_breakdown,
                'reading_breakdown': test_result.reading_breakdown,
                'writing_breakdown': test_result.writing_breakdown,
                'speaking_breakdown': test_result.speaking_breakdown,
            }
        })
    except Exception as e:
        # If grading fails, still submit the test
        return Response({
            'message': 'Test submitted successfully. Grading will be processed shortly.',
            'student_test': StudentTestSerializer(student_test).data,
            'grading_error': str(e)
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_speaking_questions(request):
    """Get speaking questions for current test variant."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Allow both in_progress and graded status (speaking can be done after other sections are graded)
    student_test = StudentTest.objects.filter(
        student=request.user,
        status__in=['in_progress', 'graded']
    ).order_by('-start_time').first()

    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    variant = student_test.variant
    speaking_file = TestFile.objects.filter(variant=variant, file_type='speaking').first()

    if not speaking_file or not speaking_file.questions_data:
        return Response(
            {'error': 'Speaking questions not found for this variant.'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        'questions_data': speaking_file.questions_data,
        'student_test_id': student_test.id
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_speaking_audio(request):
    """Upload audio for a speaking part/question."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Allow both in_progress and graded status (speaking can be recorded after other sections are graded)
    student_test = StudentTest.objects.filter(
        student=request.user,
        status__in=['in_progress', 'graded']
    ).order_by('-start_time').first()

    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    part_number = request.data.get('part_number')
    question_number = request.data.get('question_number')
    audio_file = request.FILES.get('audio_file')

    # Validate part_number - accept both int and string
    try:
        part_number = int(part_number) if part_number else None
    except (ValueError, TypeError):
        part_number = None

    if part_number not in [1, 2, 3]:
        return Response(
            {'error': 'Invalid part_number. Must be 1, 2, or 3.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not audio_file:
        return Response(
            {'error': 'No audio file provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Convert question_number to integer if provided
    question_number = int(question_number) if question_number else None

    # Save speaking response
    speaking_response, created = SpeakingResponse.objects.update_or_create(
        student_test=student_test,
        part_number=part_number,
        question_number=question_number,
        defaults={
            'audio_file': audio_file,
            'transcription_status': 'pending'
        }
    )

    return Response({
        'message': 'Audio uploaded successfully.',
        'speaking_response_id': speaking_response.id,
        'created': created
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transcribe_and_grade_speaking(request):
    """Transcribe all audio and grade speaking section."""
    if not request.user.is_student():
        return Response(
            {'error': 'Student access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Allow both in_progress and graded status (speaking grading can happen after other sections)
    student_test = StudentTest.objects.filter(
        student=request.user,
        status__in=['in_progress', 'graded']
    ).order_by('-start_time').first()

    if not student_test:
        return Response(
            {'error': 'No active test found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get all speaking responses for this student_test
    speaking_responses = SpeakingResponse.objects.filter(
        student_test=student_test
    ).order_by('part_number', 'question_number')

    if not speaking_responses.exists():
        return Response(
            {'error': 'No speaking responses found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Import grading services
    from grading.speech_to_text import transcribe_audio_whisper
    from grading.ai_speaking_grading import grade_speaking_part_ai, calculate_speaking_overall_score

    # Get speaking questions data
    variant = student_test.variant
    speaking_file = TestFile.objects.filter(variant=variant, file_type='speaking').first()

    if not speaking_file or not speaking_file.questions_data:
        return Response(
            {'error': 'Speaking questions not found for this variant.'},
            status=status.HTTP_404_NOT_FOUND
        )

    questions_data = speaking_file.questions_data
    transcription_errors = []
    grading_results = {}

    # Step 1: Transcribe all audio files
    for response in speaking_responses:
        response.transcription_status = 'processing'
        response.save()

        audio_path = response.audio_file.path
        transcription_result = transcribe_audio_whisper(audio_path)

        if transcription_result['success']:
            response.transcribed_text = transcription_result['text']
            response.transcription_status = 'completed'
            response.transcription_metadata = {
                'language': transcription_result['language'],
                'duration': transcription_result['duration']
            }
            response.save()
        else:
            response.transcription_status = 'failed'
            response.save()
            transcription_errors.append({
                'part': response.part_number,
                'question': response.question_number,
                'error': transcription_result['error']
            })

    # Step 2: Grade each part
    # Group responses by part
    responses_by_part = {}
    for response in speaking_responses:
        if response.transcription_status == 'completed':
            if response.part_number not in responses_by_part:
                responses_by_part[response.part_number] = []
            responses_by_part[response.part_number].append(response)

    part_scores = []

    for part_num in [1, 2, 3]:
        if part_num not in responses_by_part:
            continue

        part_responses = responses_by_part[part_num]

        # Get questions for this part
        if part_num == 1:
            part_data = questions_data.get('part1', {})
            topic = part_data.get('topic', 'Interview')
            questions = part_data.get('questions', [])

            # Combine all responses for part 1
            combined_text = '\n\n'.join([
                f"Q{i+1}: {questions[i] if i < len(questions) else 'Question'}\nA: {resp.transcribed_text}"
                for i, resp in enumerate(part_responses)
            ])

        elif part_num == 2:
            part_data = questions_data.get('part2', {})
            topic = part_data.get('topic', 'Long Turn')
            prompt = part_data.get('prompt', '')
            points = part_data.get('points', [])
            final = part_data.get('final', '')

            questions = [f"{prompt}\n\nYou should say:\n" + "\n".join(points) + f"\n{final}"]
            combined_text = part_responses[0].transcribed_text if part_responses else ''

        elif part_num == 3:
            part_data = questions_data.get('part3', {})
            topics = part_data.get('topics', [])

            all_questions = []
            for topic_group in topics:
                all_questions.extend(topic_group.get('questions', []))

            topic = 'Discussion'
            questions = all_questions

            # Combine all responses for part 3
            combined_text = '\n\n'.join([
                f"Q{i+1}: {all_questions[i] if i < len(all_questions) else 'Question'}\nA: {resp.transcribed_text}"
                for i, resp in enumerate(part_responses)
            ])

        # Grade this part
        grading_result = grade_speaking_part_ai(
            part_number=part_num,
            topic=topic,
            questions=questions,
            student_response=combined_text
        )

        grading_results[f'part{part_num}'] = grading_result

        if grading_result['overall_score'] is not None:
            part_scores.append(grading_result['overall_score'])

    # Step 3: Calculate overall speaking score
    overall_speaking_score = calculate_speaking_overall_score(part_scores)

    # Step 4: Save to TestResult
    test_result, created = TestResult.objects.get_or_create(
        student_test=student_test,
        defaults={'graded_by': None}
    )

    test_result.speaking_score = overall_speaking_score
    test_result.speaking_breakdown = grading_results
    test_result.save()

    # Recalculate overall score including speaking
    test_result.calculate_overall_score()

    return Response({
        'message': 'Speaking section transcribed and graded successfully.',
        'speaking_score': float(overall_speaking_score) if overall_speaking_score else None,
        'breakdown': grading_results,
        'transcription_errors': transcription_errors,
        'overall_score': float(test_result.overall_score) if test_result.overall_score else None
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
                'speaking_score': float(result.speaking_score) if result.speaking_score else None,
                'overall_score': float(result.overall_score) if result.overall_score else None,
                'listening_breakdown': result.listening_breakdown,
                'reading_breakdown': result.reading_breakdown,
                'writing_breakdown': result.writing_breakdown,
                'speaking_breakdown': result.speaking_breakdown,
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_results(request):
    """List all student test results for admin."""
    # Check if user is admin
    from accounts.models import CustomUser
    
    # Reload user to ensure we have role
    db_user = CustomUser.objects.get(id=request.user.id)
    if db_user.role != 'admin':
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    attempts = StudentTest.objects.all().select_related('student', 'variant').order_by('-start_time')
    data = []
    
    for attempt in attempts:
        data.append({
            'id': attempt.id,
            'studentId': attempt.student_id,
            'studentName': attempt.student.get_full_name() or attempt.student.username,
            'testTitle': attempt.variant.name,
            'testKey': attempt.variant.code,
            'isSubmitted': attempt.status in ['submitted', 'graded'],
            'startedAt': attempt.start_time,
            'submittedAt': attempt.submission_time,
            'status': attempt.status
        })
        
    return Response(data)

