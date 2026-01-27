from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from accounts.models import CustomUser
from .models import Variant, TestFile, Answer, MockTest, StudentTestSession
from .serializers import (
    VariantSerializer, VariantListSerializer, VariantCreateSerializer,
    TestFileSerializer, AnswerSerializer, MockTestSerializer,
    MockTestCreateSerializer, StudentTestSessionSerializer
)
from .utils import (
    count_available_variants, generate_test_id, generate_test_variants,
    check_minimum_variants, get_variant_content
)


def check_is_admin(user):
    """
    Helper function to check if user is admin.
    This function ensures the user is properly loaded from the database.
    """
    if not user:
        return False
    
    # Check if user is AnonymousUser
    if hasattr(user, 'is_anonymous') and user.is_anonymous:
        return False
    
    # Check if user is authenticated
    try:
        if not user.is_authenticated:
            return False
    except (AttributeError, TypeError):
        return False
    
    # First try using the is_admin() method if available (most efficient)
    try:
        if hasattr(user, 'is_admin') and callable(user.is_admin):
            return user.is_admin()
    except (AttributeError, TypeError):
        pass
    
    # Then check if role attribute exists on the user object (might already be loaded)
    try:
        if hasattr(user, 'role') and user.role == 'admin':
            return True
    except (AttributeError, TypeError):
        pass
    
    # If role not found or not admin, reload user from database to ensure we have latest role
    # This is the most reliable method and follows Django best practices
    try:
        if hasattr(user, 'id') and user.id:
            # Use get() to ensure we get a fresh instance with all attributes
            db_user = CustomUser.objects.get(id=user.id)
            # Verify the role is 'admin'
            return db_user.role == 'admin'
    except (CustomUser.DoesNotExist, AttributeError, ValueError, TypeError) as e:
        # Log error in production, but don't expose to user
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error checking admin status for user {getattr(user, "id", "unknown")}: {e}')
        return False
    
    return False


def require_admin(view_func):
    """Decorator to require admin role."""
    def wrapper(request, *args, **kwargs):
        if not check_is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def variant_list_create(request):
    """List all variants (GET) or create a new variant (POST)."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        variants = Variant.objects.all()
        serializer = VariantListSerializer(variants, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = VariantCreateSerializer(data=request.data)
        if serializer.is_valid():
            variant = serializer.save(created_by=request.user)
            return Response(
                VariantSerializer(variant).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def variant_detail(request, variant_id):
    """Get (GET), update (PUT), or delete (DELETE) variant."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variant = get_object_or_404(Variant, id=variant_id)
    
    if request.method == 'GET':
        serializer = VariantSerializer(variant)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = VariantCreateSerializer(variant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(VariantSerializer(variant).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        variant.delete()
        return Response({'message': 'Variant deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_test_file(request):
    """Upload test file (reading, listening, or writing)."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variant_id = request.data.get('variant_id')
    file_type = request.data.get('file_type')
    task_number = request.data.get('task_number')  # For writing files (1 or 2)
    file = request.FILES.get('file')
    audio_file = request.FILES.get('audio_file')
    
    if not all([variant_id, file_type, file]):
        return Response(
            {'error': 'variant_id, file_type, and file are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    variant = get_object_or_404(Variant, id=variant_id)
    
    # For writing files, task_number is required
    if file_type == 'writing' and not task_number:
        return Response(
            {'error': 'task_number is required for writing files (1 or 2).'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update or create test file
    # Ensure files are properly saved
    test_file, created = TestFile.objects.update_or_create(
        variant=variant,
        file_type=file_type,
        task_number=task_number if file_type == 'writing' else None,
        defaults={
            'file': file,
            'audio_file': audio_file if audio_file else None,
        }
    )
    
    # Save the instance to ensure files are written to disk
    test_file.save()
    
    # Verify files were saved correctly
    import os
    from django.conf import settings
    import logging
    logger = logging.getLogger(__name__)
    
    if test_file.file:
        file_path = test_file.file.path
        if os.path.exists(file_path):
            logger.info(f"File saved successfully: {file_path}")
        else:
            logger.error(f"File not found after save: {file_path}")
    
    if test_file.audio_file:
        audio_path = test_file.audio_file.path
        if os.path.exists(audio_path):
            logger.info(f"Audio file saved successfully: {audio_path}")
        else:
            logger.error(f"Audio file not found after save: {audio_path}")
    
    serializer = TestFileSerializer(test_file)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_answers(request):
    """Create or update answers for a variant."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variant_id = request.data.get('variant_id')
    answers_data = request.data.get('answers', [])
    
    if not variant_id:
        return Response(
            {'error': 'variant_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    variant = get_object_or_404(Variant, id=variant_id)
    created_answers = []
    
    for answer_data in answers_data:
        answer, created = Answer.objects.update_or_create(
            variant=variant,
            section=answer_data['section'],
            question_number=answer_data['question_number'],
            defaults={'correct_answer': answer_data['correct_answer']}
        )
        created_answers.append(answer)
    
    serializer = AnswerSerializer(created_answers, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request):
    """Get admin statistics."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from student_portal.models import StudentTest, TestResult
    from accounts.models import CustomUser
    
    total_variants = Variant.objects.count()
    total_students = CustomUser.objects.filter(role='student').count()
    # Total mock tests taken = all StudentTest instances (in_progress or submitted)
    total_mock_tests_taken = StudentTest.objects.count()
    
    return Response({
        'total_students': total_students,
        'total_variants': total_variants,
        'total_mock_tests_taken': total_mock_tests_taken,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_code(request, variant_id):
    """Generate a new unique 6-digit code for a variant."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variant = get_object_or_404(Variant, id=variant_id)
    
    # Generate new unique code
    from .models import generate_variant_code
    new_code = generate_variant_code()
    variant.code = new_code
    variant.save()
    
    return Response({
        'code': new_code,
        'message': 'Code generated successfully.'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_mock(request, variant_id):
    """Activate a variant and assign variants to waiting students."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variant = get_object_or_404(Variant, id=variant_id)
    variant.is_active = True
    variant.save()
    
    # Import here to avoid circular imports
    from student_portal.models import TestQueue, StudentTest
    
    # Get all waiting students for this test code
    waiting_students = TestQueue.objects.filter(
        test_code=variant.code,
        status='waiting'
    ).select_related('student')
    
    assigned_count = 0
    now = timezone.now()
    for queue_entry in waiting_students:
        StudentTest.objects.get_or_create(
            student=queue_entry.student,
            variant=variant,
            defaults={'status': 'in_progress'}
        )
        
        queue_entry.assigned_variant = variant
        queue_entry.status = 'assigned'
        queue_entry.assigned_at = now
        queue_entry.save(
            update_fields=['assigned_variant', 'status', 'assigned_at']
        )
        
        assigned_count += 1
    
    assigned_entries = TestQueue.objects.filter(
        test_code=variant.code,
        status='assigned'
    )
    
    prep_started_at = timezone.now()
    assigned_entries.update(
        status='preparation',
        preparation_started_at=prep_started_at
    )
    
    return Response({
        'message': f'Mock test activated. {assigned_count} students assigned variants.',
        'variant': VariantSerializer(variant).data,
        'assigned_count': assigned_count,
        'total_variants': 1
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_mock(request, variant_id):
    """Deactivate a variant."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    variant = get_object_or_404(Variant, id=variant_id)
    variant.is_active = False
    variant.save()
    
    return Response({
        'message': 'Mock test deactivated successfully.',
        'variant': VariantSerializer(variant).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_test_keys(request):
    """List all variants as test keys with usage stats."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    from student_portal.models import StudentTest
    from django.db.models import Count

    variants = Variant.objects.annotate(
        used_count=Count('student_tests')
    )

    data = []
    for v in variants:
        data.append({
            'id': v.id,
            'key': v.code,
            'testTitle': v.name,
            'isActive': v.is_active,
            'usedBy': v.used_count,
            'createdAt': v.created_at
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_variants_count(request):
    """Get count of available variants for each section/passage/part."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    counts = count_available_variants()

    # Check if minimum variants exist
    has_minimum, missing = check_minimum_variants()

    return Response({
        'counts': counts,
        'has_minimum': has_minimum,
        'missing_sections': missing
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_mock_test(request):
    """Create a new mock test with selected variant strategy."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if minimum variants exist
    has_minimum, missing = check_minimum_variants()
    if not has_minimum:
        return Response(
            {
                'error': 'Not enough variants to create test.',
                'missing_sections': missing
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = MockTestCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    variant_strategy = serializer.validated_data['variant_strategy']
    duration_minutes = serializer.validated_data.get('duration_minutes', 180)

    # Generate test ID
    test_id = generate_test_id()

    # If strategy is 'same', pre-generate variants
    selected_variants = None
    if variant_strategy == 'same':
        selected_variants = generate_test_variants()

    # Create mock test
    mock_test = MockTest.objects.create(
        test_id=test_id,
        variant_strategy=variant_strategy,
        selected_variants=selected_variants,
        duration_minutes=duration_minutes,
        created_by=request.user,
        is_active=True
    )

    return Response(
        MockTestSerializer(mock_test).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mock_test_list(request):
    """Get list of all mock tests."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    from django.db.models import Count

    mock_tests = MockTest.objects.annotate(
        participants_count=Count('student_sessions')
    ).order_by('-created_at')

    data = []
    for test in mock_tests:
        data.append({
            'id': test.id,
            'test_id': test.test_id,
            'variant_strategy': test.variant_strategy,
            'duration_minutes': test.duration_minutes,
            'is_active': test.is_active,
            'created_at': test.created_at,
            'participants_count': test.participants_count
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_test_content(request, test_id):
    """Get test content for a student who joined with test_id."""
    try:
        mock_test = MockTest.objects.get(test_id=test_id, is_active=True)
    except MockTest.DoesNotExist:
        return Response(
            {'error': 'Test not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if student already has a session
    session, created = StudentTestSession.objects.get_or_create(
        mock_test=mock_test,
        student=request.user,
        defaults={'status': 'waiting'}
    )

    # If new session, assign variants
    if created:
        if mock_test.variant_strategy == 'same':
            # Use pre-selected variants
            session.assigned_variants = mock_test.selected_variants
        else:
            # Generate unique variants for this student
            session.assigned_variants = generate_test_variants()
        session.save()

    # Load full content for assigned variants
    full_content = {
        'listening': {},
        'reading': {},
        'writing': {},
        'speaking': {}
    }

    for section_type, sections in session.assigned_variants.items():
        for section_name, filename in sections.items():
            if filename:
                content = get_variant_content(section_type, section_name, filename)
                full_content[section_type][section_name] = content

    return Response({
        'test_id': test_id,
        'variant_strategy': mock_test.variant_strategy,
        'duration_minutes': mock_test.duration_minutes,
        'session': StudentTestSessionSerializer(session).data,
        'content': full_content
    })

