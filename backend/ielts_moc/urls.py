"""
URL configuration for ielts_moc project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from .views import root_view, react_app_view

urlpatterns = [
    path('api/', root_view, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('exams.urls')),
    path('api/', include('student_portal.urls')),
    path('api/', include('grading.urls')),
]

# Serve media files in both development and production
# WhiteNoise handles static files automatically, but we need to serve media files
# In production, media files should ideally be served via a CDN or separate storage
# For now, we'll serve them directly with proper headers
from django.views.static import serve as static_serve
from django.urls import re_path
from django.views.decorators.cache import cache_control

def media_serve(request, path):
    """Serve media files with proper headers for audio and PDF."""
    import os
    from django.http import Http404, HttpResponse
    
    try:
        # Normalize the path (remove leading/trailing slashes, handle URL encoding)
        path = path.lstrip('/')
        
        # Build full file path
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        
        # Normalize paths to handle different OS path separators
        full_path = os.path.normpath(full_path)
        media_root = os.path.normpath(str(settings.MEDIA_ROOT))
        
        # Security check: ensure the file is within MEDIA_ROOT
        if not full_path.startswith(media_root):
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Security: Attempted access outside MEDIA_ROOT: {full_path}")
            raise Http404("Media file not found")
        
        # Check if file exists
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Media file not found: {full_path} (requested path: {path})")
            raise Http404("Media file not found")
        
        # Serve the file
        response = static_serve(request, path, document_root=settings.MEDIA_ROOT)
        
        # Set appropriate content type and headers based on file extension
        path_lower = path.lower()
        if path_lower.endswith('.mp3'):
            response['Content-Type'] = 'audio/mpeg'
            response['Accept-Ranges'] = 'bytes'
            response['Cache-Control'] = 'public, max-age=3600'
        elif path_lower.endswith('.wav'):
            response['Content-Type'] = 'audio/wav'
            response['Accept-Ranges'] = 'bytes'
            response['Cache-Control'] = 'public, max-age=3600'
        elif path_lower.endswith('.ogg') or path_lower.endswith('.oga'):
            response['Content-Type'] = 'audio/ogg'
            response['Accept-Ranges'] = 'bytes'
            response['Cache-Control'] = 'public, max-age=3600'
        elif path_lower.endswith('.m4a'):
            response['Content-Type'] = 'audio/mp4'
            response['Accept-Ranges'] = 'bytes'
            response['Cache-Control'] = 'public, max-age=3600'
        elif path_lower.endswith('.pdf'):
            response['Content-Type'] = 'application/pdf'
            response['X-Content-Type-Options'] = 'nosniff'
            response['Cache-Control'] = 'public, max-age=3600'
            # Allow PDF to be embedded in iframes (same origin)
            response['X-Frame-Options'] = 'SAMEORIGIN'
        
        # Allow CORS for media files (needed for cross-origin requests)
        origin = request.META.get('HTTP_ORIGIN', '*')
        # Only allow CORS from same origin or configured origins
        if origin == request.build_absolute_uri('/')[:-1] or origin == '*':
            response['Access-Control-Allow-Origin'] = origin
        else:
            # Check if origin is in allowed CORS origins
            allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
            if origin in allowed_origins:
                response['Access-Control-Allow-Origin'] = origin
        
        response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        
        return response
    except Http404:
        # Re-raise 404
        raise
    except Exception as e:
        # Log error and return 404
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error serving media file {path}: {e}")
        raise Http404("Media file not found")

# Serve media files
urlpatterns += [
    re_path(
        r'^media/(?P<path>.*)$',
        cache_control(max_age=3600)(media_serve),
        name='media'
    ),
]

# Serve static files in development (WhiteNoise handles in production)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Serve React app for all non-API routes (SPA routing)
# This must be last to catch all routes not matched above
# Exclude: api, admin, static, media, and assets (React build assets)
urlpatterns += [
    re_path(r'^(?!api|admin|static|media|assets).*$', react_app_view, name='react-app'),
]

