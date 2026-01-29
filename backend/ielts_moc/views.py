"""
Root views for ielts_moc project.
"""
import os
import logging
from django.http import JsonResponse, HttpResponse
from django.conf import settings

logger = logging.getLogger(__name__)

# Cache the HTML content to avoid repeated file reads
_cached_html = None
_cached_path = None


def health_check(request):
    """
    Simple health check endpoint for Railway/Render deployment.
    Returns 200 OK if the server is running.
    """
    return JsonResponse({'status': 'ok'})


def root_view(request):
    """
    Root endpoint that provides API information.
    """
    return JsonResponse({
        'message': 'IELTS MOC API',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': {
                'accounts': '/api/accounts/',
                'exams': '/api/exams/',
                'student_portal': '/api/student_portal/',
                'grading': '/api/grading/',
            }
        },
        'status': 'running'
    })


def _read_html_file(path):
    """
    Safely read HTML file with multiple encoding fallbacks.
    Returns (html_content, success) tuple.
    """
    if not path or not os.path.exists(path):
        return None, False
    
    if not os.path.isfile(path):
        logger.warning(f"Path exists but is not a file: {path}")
        return None, False
    
    # Try multiple encodings in order of likelihood
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
    
    for encoding in encodings:
        try:
            with open(path, 'r', encoding=encoding) as f:
                html = f.read()
            logger.debug(f"Successfully read {path} with encoding {encoding}")
            return html, True
        except UnicodeDecodeError as e:
            logger.debug(f"Failed to read {path} with encoding {encoding}: {e}")
            continue
        except PermissionError as e:
            logger.error(f"Permission denied reading {path}: {e}")
            return None, False
        except OSError as e:
            logger.error(f"OS error reading {path}: {e}")
            return None, False
        except Exception as e:
            logger.error(f"Unexpected error reading {path} with encoding {encoding}: {type(e).__name__}: {e}")
            continue
    
    logger.error(f"Failed to read {path} with all attempted encodings: {encodings}")
    return None, False


def react_app_view(request):
    """
    Serve React app index.html for all non-API routes (SPA routing).
    Checks multiple possible locations for the React build.
    Prefer the collected static index to ensure correct /static/ asset URLs.
    Also performs a safe rewrite from /assets → /static/assets if needed.
    
    Uses caching to avoid repeated file reads and includes proper error handling.
    
    In Railway deployment with separate frontend/backend services, if frontend
    build is not found, returns API information instead of 404.
    """
    global _cached_html, _cached_path
    
    # Prefer the collected static index (served with WhiteNoise at /static/)
    preferred_static_index = os.path.join(settings.STATIC_ROOT, 'index.html') if settings.STATIC_ROOT else None

    # Other possible locations for React build
    fallback_paths = [
        os.path.join(settings.BASE_DIR, 'staticfiles', 'index.html'),  # Default collectstatic output
        os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist', 'index.html'),  # Original build location
    ]

    # Build ordered list (preferred first)
    possible_paths = ([preferred_static_index] if preferred_static_index else []) + fallback_paths

    # Check cache first (if path still exists)
    if _cached_html and _cached_path and os.path.exists(_cached_path):
        try:
            return HttpResponse(_cached_html, content_type='text/html')
        except Exception as e:
            logger.warning(f"Error serving cached HTML: {e}, will re-read file")
            _cached_html = None
            _cached_path = None

    # Try each path in order
    for path in possible_paths:
        html, success = _read_html_file(path)
        if success:
            # Rewrite asset paths if needed
            if html and ('"/assets/' in html or "'/assets/" in html or '="assets/' in html or "='assets/" in html):
                html = html.replace('"/assets/', '"/static/assets/')
                html = html.replace("'/assets/", "'/static/assets/")
                html = html.replace('="assets/', '="/static/assets/')
                html = html.replace("='assets/", "='/static/assets/")
            
            # Cache the result
            _cached_html = html
            _cached_path = path
            logger.info(f"Serving React app from: {path}")
            return HttpResponse(html, content_type='text/html')
        elif path:
            logger.debug(f"Could not read from {path}, trying next location")

    # All paths failed - In Railway with separate services, frontend is served separately
    # Return API info instead of error to avoid confusion
    logger.info("Frontend build not found. This is expected in Railway deployment with separate frontend/backend services.")
    logger.info(f"Checked paths: {possible_paths}")
    
    # Return API information page instead of error
    api_info_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>IELTS MOC API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .info { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .endpoint { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #007bff; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h1>IELTS MOC API</h1>
        <div class="info">
            <p><strong>Status:</strong> Running</p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p>This is the backend API service. The frontend is served separately.</p>
        </div>
        <h2>API Endpoints</h2>
        <div class="endpoint">
            <strong>Health Check:</strong> <code>GET /health/</code>
        </div>
        <div class="endpoint">
            <strong>API Root:</strong> <code>GET /api/</code>
        </div>
        <div class="endpoint">
            <strong>Admin:</strong> <code>/admin/</code>
        </div>
        <div class="endpoint">
            <strong>Accounts:</strong> <code>/api/accounts/</code>
        </div>
        <div class="endpoint">
            <strong>Exams:</strong> <code>/api/exams/</code>
        </div>
        <div class="endpoint">
            <strong>Student Portal:</strong> <code>/api/student_portal/</code>
        </div>
        <div class="endpoint">
            <strong>Grading:</strong> <code>/api/grading/</code>
        </div>
    </body>
    </html>
    """
    return HttpResponse(api_info_html, content_type='text/html')

