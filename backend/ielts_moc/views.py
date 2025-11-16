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
    Prefer the collected static index to ensure correct /static/ asset URLs.
    Also performs a safe rewrite from /assets → /static/assets if needed.
    """
    # Prefer the collected static index (served with WhiteNoise at /static/)
    preferred_static_index = os.path.join(settings.STATIC_ROOT, 'index.html') if settings.STATIC_ROOT else None

    # Other possible locations for React build
    fallback_paths = [
        os.path.join(settings.BASE_DIR, 'staticfiles', 'index.html'),  # Default collectstatic output
        os.path.join(settings.BASE_DIR.parent, 'client', 'dist', 'index.html'),  # Original build location
    ]

    # Build ordered list (preferred first)
    possible_paths = ([preferred_static_index] if preferred_static_index else []) + fallback_paths

    for path in possible_paths:
        if path and os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    html = f.read()
                # If asset paths point to /assets, rewrite to /static/assets
                if '"/assets/' in html or "'/assets/" in html or '="assets/' in html or "='assets/" in html:
                    html = html.replace('"/assets/', '"/static/assets/')
                    html = html.replace("'/assets/", "'/static/assets/")
                    html = html.replace('="assets/', '="/static/assets/')
                    html = html.replace("='assets/", "='/static/assets/")
                return HttpResponse(html, content_type='text/html')
            except Exception:
                continue

    return HttpResponse(
        '<h1>Frontend build not found. Please build the React app first.</h1>'
        '<p>Expected locations:</p><ul>'
        + ''.join([f'<li>{p}</li>' for p in possible_paths if p])
        + '</ul>',
        status=404
    )

