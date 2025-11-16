"""
Root views for ielts_moc project.
"""
from django.http import JsonResponse


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

