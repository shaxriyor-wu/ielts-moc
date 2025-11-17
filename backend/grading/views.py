from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.models import CustomUser
from student_portal.models import StudentTest, TestResult
from .services import grade_test


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
    
    # Always reload user from database to ensure we have latest role and all attributes
    # This is the most reliable method and follows Django best practices
    try:
        if hasattr(user, 'id') and user.id:
            # Use get() to ensure we get a fresh instance
            db_user = CustomUser.objects.get(id=user.id)
            # Verify the role is 'admin'
            return db_user.role == 'admin'
    except (CustomUser.DoesNotExist, AttributeError, ValueError, TypeError) as e:
        # Log error in production, but don't expose to user
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error checking admin status: {e}')
        return False
    
    return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_student_test(request, test_id):
    """Grade a submitted test."""
    if not check_is_admin(request.user):
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_test = get_object_or_404(StudentTest, id=test_id)
    
    if student_test.status != 'submitted':
        return Response(
            {'error': 'Test must be submitted before grading.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        result = grade_test(student_test)
        result.graded_by = request.user
        result.save()
        
        from student_portal.serializers import TestResultSerializer
        serializer = TestResultSerializer(result)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

