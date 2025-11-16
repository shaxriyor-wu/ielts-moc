from django.urls import path
from . import views

urlpatterns = [
    path('auth/login', views.unified_login, name='unified_login'),
    path('admin/login', views.admin_login, name='admin_login'),
    path('student/login', views.student_login, name='student_login'),
    path('logout', views.logout, name='logout'),
    path('user', views.current_user, name='current_user'),
]

