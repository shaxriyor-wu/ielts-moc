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
    # VIP management
    path('admin/vip/search', views.search_users_for_vip, name='vip_search_users'),
    path('admin/vip/add', views.add_vip_user, name='vip_add_user'),
    path('admin/vip/remove/<int:pk>', views.remove_vip_user, name='vip_remove_user'),
    path('admin/vip/users', views.get_vip_users, name='vip_users'),
    # Student VIP variants
    path('student/vip-variants', views.get_vip_variants, name='vip_variants'),
    path('student/vip-variant-preview/<str:section_type>/<str:section_name>/<str:filename>', views.get_vip_variant_preview, name='vip_variant_preview'),
]

