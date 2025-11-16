from django.urls import path
from . import views
from . import owner_views

urlpatterns = [
    path('auth/login', views.unified_login, name='unified_login'),
    path('auth/register', views.register, name='register'),
    path('admin/login', views.admin_login, name='admin_login'),
    path('student/login', views.student_login, name='student_login'),
    path('logout', views.logout, name='logout'),
    path('user', views.current_user, name='current_user'),
    # Owner endpoints
    path('owner/login', owner_views.owner_login, name='owner_login'),
    path('owner/stats', owner_views.get_system_stats, name='owner_stats'),
    path('owner/admins', owner_views.admin_management, name='owner_admins'),
    path('owner/admins/<int:admin_id>', owner_views.admin_detail, name='owner_admin_detail'),
    path('owner/admins/<int:admin_id>/reset-password', owner_views.reset_admin_password, name='owner_reset_password'),
    path('owner/admins/<int:admin_id>/activate', owner_views.admin_detail, name='owner_activate_admin'),
    path('owner/admins/<int:admin_id>/stats', owner_views.get_admin_stats, name='owner_admin_stats'),
    path('owner/students', owner_views.get_students, name='owner_students'),
    path('owner/tests', owner_views.get_tests, name='owner_tests'),
    path('owner/attempts', owner_views.get_attempts, name='owner_attempts'),
]

