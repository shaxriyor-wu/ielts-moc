from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')


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
        
        if login and password:
            # Try to authenticate with username or email
            user = None
            if '@' in login:
                try:
                    user_obj = CustomUser.objects.get(email=login)
                    user = authenticate(username=user_obj.username, password=password)
                except CustomUser.DoesNotExist:
                    pass
            else:
                user = authenticate(username=login, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include "login" and "password".')

