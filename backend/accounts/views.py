from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer, UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def unified_login(request):
    """Unified login endpoint that handles admin and student."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login endpoint."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Check if user is admin
        if not user.is_admin():
            return Response(
                {'error': 'Access denied. Admin role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def student_login(request):
    """Student login endpoint."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Check if user is student
        if not user.is_student():
            return Response(
                {'error': 'Access denied. Student role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

