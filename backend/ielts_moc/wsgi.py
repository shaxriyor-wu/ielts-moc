"""
WSGI config for ielts_moc project.

This file redirects to wsgi_init which ensures database is migrated.
For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

# Import from wsgi_init to ensure database migrations run
from ielts_moc.wsgi_init import application

# Re-export for compatibility
__all__ = ['application']

