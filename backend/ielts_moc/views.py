"""
Root views for ielts_moc project.
"""
import os
from django.http import JsonResponse, HttpResponse
from django.conf import settings


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


def react_app_view(request):
    """
    Serve React app index.html for all non-API routes (SPA routing).
    Checks multiple possible locations for the React build.
    """
    # Possible locations for React build
    possible_paths = [
        os.path.join(settings.BASE_DIR.parent, 'client', 'dist', 'index.html'),  # Original build location
        os.path.join(settings.BASE_DIR, 'staticfiles', 'index.html'),  # After collectstatic
        os.path.join(settings.STATIC_ROOT, 'index.html') if settings.STATIC_ROOT else None,  # Static root
    ]
    
    # Filter out None values
    possible_paths = [path for path in possible_paths if path]
    
    # Try to find and serve the React app
    for frontend_build_path in possible_paths:
        if os.path.exists(frontend_build_path):
            try:
                with open(frontend_build_path, 'r', encoding='utf-8') as f:
                    return HttpResponse(f.read(), content_type='text/html')
            except Exception as e:
                continue
    
    # If not found, return error message
    return HttpResponse(
        '<h1>Frontend build not found. Please build the React app first.</h1>'
        '<p>Expected locations:</p><ul>'
        + ''.join([f'<li>{path}</li>' for path in possible_paths])
        + '</ul>',
        status=404
    )

