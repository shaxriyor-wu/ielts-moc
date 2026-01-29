from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer, UserSerializer
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def unified_login(request):
    """Unified login endpoint that handles admin and student."""
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            try:
                refresh = RefreshToken.for_user(user)
                user_data = UserSerializer(user).data
                
                return Response({
                    'accessToken': str(refresh.access_token),
                    'refreshToken': str(refresh),
                    'user': user_data
                })
            except Exception as e:
                logger.error(f'Error generating token for user {user.username}: {str(e)}', exc_info=True)
                return Response(
                    {'error': 'Failed to generate authentication token. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Login error: {str(e)}', exc_info=True)
        return Response(
            {'error': 'An error occurred during login. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login endpoint."""
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Check if user is admin
            if not user.is_admin():
                return Response(
                    {'error': 'Access denied. Admin role required.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            try:
                refresh = RefreshToken.for_user(user)
                user_data = UserSerializer(user).data
                
                return Response({
                    'accessToken': str(refresh.access_token),
                    'refreshToken': str(refresh),
                    'user': user_data
                })
            except Exception as e:
                logger.error(f'Error generating token for admin {user.username}: {str(e)}', exc_info=True)
                return Response(
                    {'error': 'Failed to generate authentication token. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Admin login error: {str(e)}', exc_info=True)
        return Response(
            {'error': 'An error occurred during login. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def student_login(request):
    """Student login endpoint."""
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Check if user is student
            if not user.is_student():
                return Response(
                    {'error': 'Access denied. Student role required.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            try:
                refresh = RefreshToken.for_user(user)
                user_data = UserSerializer(user).data
                
                return Response({
                    'accessToken': str(refresh.access_token),
                    'refreshToken': str(refresh),
                    'user': user_data
                })
            except Exception as e:
                logger.error(f'Error generating token for student {user.username}: {str(e)}', exc_info=True)
                return Response(
                    {'error': 'Failed to generate authentication token. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Student login error: {str(e)}', exc_info=True)
        return Response(
            {'error': 'An error occurred during login. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint."""
    try:
        refresh_token = request.data.get('refreshToken')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Student registration endpoint."""
    from .serializers import RegisterSerializer
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'accessToken': str(refresh.access_token),
                'refreshToken': str(refresh),
                'user': UserSerializer(user).data,
                'role': user.role
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Registration error: {e}')
            return Response(
                {'error': 'Registration failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Return validation errors in a consistent format
    errors = serializer.errors
    if isinstance(errors, dict):
        # Extract first error message
        error_messages = []
        for field, field_errors in errors.items():
            if isinstance(field_errors, list):
                error_messages.extend(field_errors)
            else:
                error_messages.append(str(field_errors))
        
        error_message = error_messages[0] if error_messages else 'Invalid registration data'
        return Response(
            {'error': error_message, 'errors': errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response(
        {'error': 'Invalid registration data', 'errors': errors},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user."""
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students(request):
    """List all students for admin dashboard."""
    # Check if user is admin
    from accounts.models import CustomUser
    from student_portal.models import StudentTest
    from django.db.models import Count, Max, Q
    
    # Reload user to ensure we have role
    db_user = CustomUser.objects.get(id=request.user.id)
    if db_user.role != 'admin':
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filters
    search_query = request.GET.get('search', '').lower()
    
    students_query = CustomUser.objects.filter(role='student')
    
    # Filter by search query
    if search_query:
        students_query = students_query.filter(
            Q(username__icontains=search_query) | 
            Q(first_name__icontains=search_query) | 
            Q(last_name__icontains=search_query)
        )
        
    students = students_query.annotate(
        totalAttempts=Count('test_attempts'),
        completedAttempts=Count('test_attempts', filter=Q(test_attempts__status__in=['submitted', 'graded'])),
        lastAttempt=Max('test_attempts__start_time')
    ).order_by('-date_joined')
    
    data = []
    for s in students:
        data.append({
            'id': s.id,
            'name': s.get_full_name() or s.username,
            'username': s.username,
            'email': s.email,
            'status': 'active' if s.is_active else 'inactive',
            'testCode': 'N/A', # Placeholder, normally stored in profile
            'createdAt': s.date_joined,
            'totalAttempts': s.totalAttempts,
            'completedAttempts': s.completedAttempts,
            'lastAttempt': s.lastAttempt
        })
        
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """Create a new user (admin only)."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
    data = request.data
    from accounts.models import CustomUser
    
    try:
        username = data.get('username')
        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = CustomUser.objects.create_user(
            username=username,
            password=data.get('password'),
            first_name=data.get('fullName', '').split(' ')[0],
            last_name=' '.join(data.get('fullName', '').split(' ')[1:]) if ' ' in data.get('fullName', '') else '',
            role='student' 
        )
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request, pk):
    """Update user (admin only)."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
    from accounts.models import CustomUser
    try:
        user = CustomUser.objects.get(pk=pk)
        data = request.data
        
        if 'username' in data and data['username'] != user.username:
            if CustomUser.objects.filter(username=data['username']).exists():
                return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = data['username']
            
        if 'fullName' in data:
            parts = data['fullName'].split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            
        if 'password' in data and data['password']:
            user.set_password(data['password'])
            
        if 'status' in data:
            user.is_active = (data['status'] == 'active')
            
        user.save()
        return Response(UserSerializer(user).data)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):
    """Delete user (admin only)."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
    from accounts.models import CustomUser
    try:
        user = CustomUser.objects.get(pk=pk)
        user.delete()
        return Response({'message': 'User deleted successfully'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

