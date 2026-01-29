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
        logger.info("WSGI: Checking database connection...")
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        logger.info("WSGI: Database connection OK")
        
        # Check if tables exist by trying to query
        from accounts.models import CustomUser
        try:
            CustomUser.objects.exists()
            logger.info("WSGI: Database tables exist, skipping migration")
            _initialized = True
            return
        except Exception as e:
            error_str = str(e).lower()
            if 'does not exist' in error_str or 'no such table' in error_str:
                logger.warning("WSGI: Database tables not found, running migrations...")
                print("WSGI: Running migrations...", flush=True)
                # Run migrations
                call_command('migrate', verbosity=1, interactive=False)
                logger.info("WSGI: Migrations completed")
                print("WSGI: Migrations completed", flush=True)
                
                # Initialize users
                try:
                    logger.info("WSGI: Initializing default users...")
                    call_command('init_users', verbosity=1)
                    logger.info("WSGI: Default users initialized")
                    print("WSGI: Default users initialized", flush=True)
                except Exception as init_error:
                    logger.warning(f"WSGI: User initialization failed: {init_error}")
                    print(f"WSGI: User initialization failed: {init_error}", flush=True)
                
                _initialized = True
            else:
                logger.error(f"WSGI: Database error: {e}")
                print(f"WSGI: Database error: {e}", flush=True)
                raise
    except Exception as e:
        logger.error(f"WSGI: Database initialization error: {e}")
        print(f"WSGI: Database initialization error: {e}", flush=True)
        # Don't raise - let the request fail with proper error
        pass

# Get WSGI application first
application = get_wsgi_application()

# Initialize database after WSGI app is loaded
# This ensures Django is fully initialized
try:
    ensure_database_ready()
except Exception as e:
    logger.error(f"Failed to initialize database in WSGI: {e}")

# Wrap the application to ensure DB is ready on first request
_original_application = application

def wrapped_application(environ, start_response):
    """Wrapper that ensures database is ready before handling request."""
    global _initialized
    if not _initialized:
        try:
            logger.info("WSGI: First request detected, ensuring database is ready...")
            print("WSGI: First request detected, ensuring database is ready...", flush=True)
            ensure_database_ready()
        except Exception as e:
            logger.error(f"WSGI: Database initialization error on request: {e}")
            print(f"WSGI: Database initialization error on request: {e}", flush=True)
    return _original_application(environ, start_response)

application = wrapped_application

