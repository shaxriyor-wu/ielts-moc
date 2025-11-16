from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from student_portal.models import StudentTest, TestResult
from .services import grade_test


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_student_test(request, test_id):
    """Grade a submitted test."""
    if not request.user.is_admin():
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

