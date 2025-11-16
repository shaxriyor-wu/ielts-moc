from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CustomUser
from .serializers import UserSerializer
from exams.models import Variant
from student_portal.models import StudentTest, TestResult


def check_is_owner(user):
    """Helper function to check if user is owner."""
    if hasattr(user, 'is_owner'):
        return user.is_owner()
    elif hasattr(user, 'role'):
        return user.role == 'owner'
    elif hasattr(user, 'is_authenticated') and user.is_authenticated:
        try:
            db_user = CustomUser.objects.get(id=user.id)
            return db_user.role == 'owner'
        except CustomUser.DoesNotExist:
            return False
    return False


@api_view(['POST'])
@permission_classes([AllowAny])
def owner_login(request):
    """Owner login endpoint."""
    from .serializers import LoginSerializer
    from rest_framework_simplejwt.tokens import RefreshToken
    
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Check if user is owner
        if not check_is_owner(user):
            return Response(
                {'error': 'Access denied. Owner role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_stats(request):
    """Get system-wide statistics for owner dashboard."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Count admins
    total_admins = CustomUser.objects.filter(role='admin').count()
    active_admins = CustomUser.objects.filter(role='admin', is_active=True).count()
    
    # Count students
    total_students = CustomUser.objects.filter(role='student').count()
    
    # Count tests/variants
    total_tests = Variant.objects.count()
    active_tests = Variant.objects.filter(is_active=True).count()
    
    # Count attempts
    total_attempts = StudentTest.objects.count()
    completed_attempts = StudentTest.objects.filter(status__in=['submitted', 'graded']).count()
    
    return Response({
        'total_admins': total_admins,
        'active_admins': active_admins,
        'total_students': total_students,
        'total_tests': total_tests,
        'active_tests': active_tests,
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_management(request):
    """Manage admins - GET list, POST create."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        # Get all admins
        admins = CustomUser.objects.filter(role='admin').order_by('-date_joined')
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create new admin
        username = request.data.get('username') or request.data.get('login')
        email = request.data.get('email', '')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if CustomUser.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        admin = CustomUser.objects.create_user(
            username=username,
            email=email if email else None,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='admin'
        )
        
        return Response(UserSerializer(admin).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_detail(request, admin_id):
    """Get, update, delete, or activate/deactivate admin."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    admin = get_object_or_404(CustomUser, id=admin_id, role='admin')
    
    if request.method == 'GET':
        serializer = UserSerializer(admin)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Update admin
        serializer = UserSerializer(admin, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        admin.delete()
        return Response({'message': 'Admin deleted successfully.'}, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Activate/deactivate admin
        is_active = request.data.get('isActive', request.data.get('is_active'))
        if is_active is not None:
            admin.is_active = bool(is_active)
            admin.save()
            return Response(UserSerializer(admin).data)
        return Response({'error': 'isActive field is required.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_admin_password(request, admin_id):
    """Reset admin password."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    admin = get_object_or_404(CustomUser, id=admin_id, role='admin')
    new_password = request.data.get('newPassword') or request.data.get('new_password')
    
    if not new_password:
        return Response(
            {'error': 'newPassword is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    admin.set_password(new_password)
    admin.save()
    
    return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_stats(request, admin_id):
    """Get statistics for a specific admin."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    admin = get_object_or_404(CustomUser, id=admin_id, role='admin')
    
    # Count variants created by this admin
    variants_created = Variant.objects.filter(created_by=admin).count()
    active_variants = Variant.objects.filter(created_by=admin, is_active=True).count()
    
    return Response({
        'admin_id': admin.id,
        'username': admin.username,
        'variants_created': variants_created,
        'active_variants': active_variants,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students(request):
    """Get all students."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    students = CustomUser.objects.filter(role='student').order_by('-date_joined')
    serializer = UserSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tests(request):
    """Get all tests/variants."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from exams.serializers import VariantListSerializer
    variants = Variant.objects.all().order_by('-created_at')
    serializer = VariantListSerializer(variants, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attempts(request):
    """Get all test attempts."""
    if not check_is_owner(request.user):
        return Response(
            {'error': 'Owner access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from student_portal.serializers import StudentTestSerializer
    attempts = StudentTest.objects.all().order_by('-start_time')
    serializer = StudentTestSerializer(attempts, many=True)
    return Response(serializer.data)

