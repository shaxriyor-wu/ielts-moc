from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.models import CustomUser
from student_portal.models import StudentTest, TestResult
from .services import grade_test


def check_is_admin(user):
    """Helper function to check if user is admin or owner."""
    if not user:
        return False
    
    # Check if user is authenticated (is_authenticated is a property, not attribute)
    try:
        if not getattr(user, 'is_authenticated', False):
            return False
    except (AttributeError, TypeError):
        return False
    
    # First try to use the method if available
    try:
        if hasattr(user, 'is_admin') and callable(user.is_admin):
            if user.is_admin():
                return True
        
        if hasattr(user, 'is_owner') and callable(user.is_owner):
            if user.is_owner():
                return True  # Owners can access admin endpoints
    except (AttributeError, TypeError):
        pass
    
    # Check role attribute directly
    try:
        if hasattr(user, 'role') and user.role in ['admin', 'owner']:
            return True
    except (AttributeError, TypeError):
        pass
    
    # Reload user from database to ensure we have latest role
    try:
        if hasattr(user, 'id') and user.id:
            db_user = CustomUser.objects.get(id=user.id)
            if db_user.role in ['admin', 'owner']:
                return True
    except (CustomUser.DoesNotExist, AttributeError, ValueError, TypeError):
        pass
    
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

