from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from accounts.models import CustomUser
from .models import Variant, TestFile, Answer
from .serializers import (
    VariantSerializer, VariantListSerializer, VariantCreateSerializer,
    TestFileSerializer, AnswerSerializer
)


def check_is_admin(user):
    """Helper function to check if user is admin."""
    if not user:
        return False
    
    # Check if user is authenticated
    try:
        if not user.is_authenticated:
            return False
    except (AttributeError, TypeError):
        return False
    
    # Check if user is AnonymousUser
    if hasattr(user, 'is_anonymous') and user.is_anonymous:
        return False
    
    # Reload user from database to ensure we have latest role (most reliable)
    try:
        if hasattr(user, 'id') and user.id:
            db_user = CustomUser.objects.select_related().get(id=user.id)
            if db_user.role == 'admin':
                return True
    except (CustomUser.DoesNotExist, AttributeError, ValueError, TypeError):
        pass
    
    # Fallback: Check role attribute directly
    try:
        if hasattr(user, 'role') and user.role == 'admin':
            return True
    except (AttributeError, TypeError):
        pass
    
    # Fallback: Try to use the method if available
    try:
        if hasattr(user, 'is_admin') and callable(user.is_admin):
            if user.is_admin():
                return True
    except (AttributeError, TypeError):
        pass
    
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
    test_file, created = TestFile.objects.update_or_create(
        variant=variant,
        file_type=file_type,
        task_number=task_number if file_type == 'writing' else None,
        defaults={
            'file': file,
            'audio_file': audio_file if audio_file else None,
        }
    )
    
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
    import random
    
    # Get all waiting students for this test code
    waiting_students = TestQueue.objects.filter(
        test_code=variant.code,
        status='waiting'
    )
    
    # Get all active variants
    active_variants = list(Variant.objects.filter(is_active=True))
    
    if not active_variants:
        return Response({
            'message': 'No active variants available.',
            'variant': VariantSerializer(variant).data
        })
    
    # Randomly assign variants to waiting students
    assigned_count = 0
    for queue_entry in waiting_students:
        # Randomly select a variant
        assigned_variant = random.choice(active_variants)
        
        # Create StudentTest
        student_test, created = StudentTest.objects.get_or_create(
            student=queue_entry.student,
            variant=assigned_variant,
            defaults={'status': 'in_progress'}
        )
        
        # Update queue entry
        queue_entry.assigned_variant = assigned_variant
        queue_entry.status = 'assigned'
        queue_entry.assigned_at = timezone.now()
        queue_entry.save()
        
        assigned_count += 1
    
    # Start preparation phase for all assigned students
    assigned_entries = TestQueue.objects.filter(
        test_code=variant.code,
        status='assigned'
    )
    
    for queue_entry in assigned_entries:
        queue_entry.status = 'preparation'
        queue_entry.preparation_started_at = timezone.now()
        queue_entry.save()
    
    return Response({
        'message': f'Mock test activated. {assigned_count} students assigned variants.',
        'variant': VariantSerializer(variant).data,
        'assigned_count': assigned_count,
        'total_variants': len(active_variants)
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

