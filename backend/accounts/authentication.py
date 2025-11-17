"""
Custom JWT authentication to ensure user object is properly loaded.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from accounts.models import CustomUser


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that ensures the user object has all attributes loaded.
    This ensures the user's role and other attributes are always fresh from the database.
    """
    def get_user(self, validated_token):
        """
        Override to ensure user is fully loaded from database with all attributes.
        Django REST Framework SimpleJWT stores user_id in the token.
        """
        try:
            # SimpleJWT stores the user ID in the token payload
            user_id = validated_token.get('user_id')
            if not user_id:
                raise InvalidToken('Token contained no recognizable user identification')
            
            # Load user from database to ensure all attributes are current
            # Use select_related/prefetch_related if needed, but for now just get the user
            user = CustomUser.objects.get(id=user_id)
            
            # Ensure the user object has the role attribute properly set
            # Refresh from database to avoid any caching issues
            user.refresh_from_db()
            
            return user
        except CustomUser.DoesNotExist:
            raise InvalidToken('User not found')
        except (KeyError, TypeError, ValueError) as e:
            raise InvalidToken(f'Token validation failed: {str(e)}')

