from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import DatabaseError
from .models import CustomUser
import logging

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    role = serializers.CharField(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'role')
    
    def to_representation(self, instance):
        """Ensure role field is always present and valid."""
        data = super().to_representation(instance)
        
        # Ensure role is set (handle cases where it might be None after migration)
        if not data.get('role') or data['role'] not in ['admin', 'student']:
            # Try to refresh from database
            try:
                instance.refresh_from_db()
                if hasattr(instance, 'role') and instance.role:
                    data['role'] = instance.role
                else:
                    # Default to student if role is missing
                    data['role'] = 'student'
            except Exception as e:
                logger.warning(f'Could not refresh user role for {instance.username}: {str(e)}')
                data['role'] = 'student'
        
        return data


class RegisterSerializer(serializers.Serializer):
    """Serializer for registration requests."""
    fullName = serializers.CharField(required=True, max_length=255)
    login = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    
    def validate_login(self, value):
        """Validate that login is unique."""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this login already exists.')
        # Also check if it's an email and if email is already taken
        if '@' in value and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value
    
    def create(self, validated_data):
        """Create a new student user."""
        full_name = validated_data.get('fullName', '').strip()
        login = validated_data.get('login', '').strip()
        password = validated_data.get('password')
        
        # Split full name into first and last name
        name_parts = full_name.split(maxsplit=1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Determine username and email
        username = login
        email = login if '@' in login else None
        
        # Create user
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='student'
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login requests."""
    login = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        login = attrs.get('login')
        password = attrs.get('password')
        
        if not login or not password:
            raise serializers.ValidationError('Must include "login" and "password".')
        
        try:
            # Try to authenticate with username or email
            user = None
            if '@' in login:
                try:
                    user_obj = CustomUser.objects.get(email=login)
                    user = authenticate(username=user_obj.username, password=password)
                except CustomUser.DoesNotExist:
                    pass
                except DatabaseError as e:
                    logger.error(f'Database error during login with email {login}: {str(e)}', exc_info=True)
                    raise serializers.ValidationError('Database error. Please try again later.')
            else:
                try:
                    user = authenticate(username=login, password=password)
                except DatabaseError as e:
                    logger.error(f'Database error during login with username {login}: {str(e)}', exc_info=True)
                    raise serializers.ValidationError('Database error. Please try again later.')
            
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            
            # Ensure user has role attribute (refresh from DB if needed)
            try:
                if not hasattr(user, 'role') or user.role is None:
                    user.refresh_from_db()
            except Exception as e:
                logger.warning(f'Could not refresh user from DB: {str(e)}')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            attrs['user'] = user
            return attrs
        except serializers.ValidationError:
            raise
        except Exception as e:
            logger.error(f'Unexpected error during login validation: {str(e)}', exc_info=True)
            raise serializers.ValidationError('An error occurred during authentication. Please try again.')

