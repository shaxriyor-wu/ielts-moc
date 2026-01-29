"""
WSGI config for ielts_moc project with database initialization.

This wrapper ensures database is migrated before handling any requests.
"""

import os
import sys
from django.core.wsgi import get_wsgi_application
from django.core.management import call_command
from django.db import connection
import logging

logger = logging.getLogger(__name__)

# Set default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ielts_moc.settings')

# Flag to track if initialization has been done
_initialized = False

def ensure_database_ready():
    """Ensure database is migrated and initialized."""
    global _initialized
    
    if _initialized:
        return
    
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Check if tables exist by trying to query
        from accounts.models import CustomUser
        try:
            CustomUser.objects.exists()
            logger.info("Database tables exist, skipping migration")
            _initialized = True
            return
        except Exception as e:
            error_str = str(e).lower()
            if 'does not exist' in error_str or 'no such table' in error_str:
                logger.warning("Database tables not found, running migrations...")
                # Run migrations
                call_command('migrate', verbosity=0, interactive=False)
                logger.info("Migrations completed")
                
                # Initialize users
                try:
                    call_command('init_users', verbosity=0)
                    logger.info("Default users initialized")
                except Exception as init_error:
                    logger.warning(f"User initialization failed: {init_error}")
                
                _initialized = True
            else:
                logger.error(f"Database error: {e}")
                raise
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        # Don't raise - let the request fail with proper error
        pass

# Initialize database before loading WSGI app
try:
    ensure_database_ready()
except Exception as e:
    logger.error(f"Failed to initialize database in WSGI: {e}")

# Get WSGI application
application = get_wsgi_application()

