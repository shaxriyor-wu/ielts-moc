from django.urls import path
from . import views

urlpatterns = [
    path('auth/login', views.unified_login, name='unified_login'),
    path('auth/register', views.register, name='register'),
    path('admin/login', views.admin_login, name='admin_login'),
    path('student/login', views.student_login, name='student_login'),
    path('logout', views.logout, name='logout'),
    path('user', views.current_user, name='current_user'),
    path('admin/students', views.get_students, name='admin_students'),
    path('admin/users', views.create_user, name='admin_create_user'),
    path('admin/users/<int:pk>', views.update_user, name='admin_update_user'),
    path('admin/users/<int:pk>/delete', views.delete_user, name='admin_delete_user'),
]

