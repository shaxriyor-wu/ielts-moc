from django.urls import path
from . import views

urlpatterns = [
    path('admin/tests', views.variant_list_create, name='variant_list_create'),
    path('admin/tests/<int:variant_id>', views.variant_detail, name='variant_detail'),
    path('admin/tests/<int:variant_id>/generate-code', views.generate_code, name='generate_code'),
    path('admin/tests/<int:variant_id>/start-mock', views.start_mock, name='start_mock'),
    path('admin/tests/<int:variant_id>/stop-mock', views.stop_mock, name='stop_mock'),
    path('admin/tests/upload', views.upload_test_file, name='upload_test_file'),
    path('admin/tests/answers', views.create_answers, name='create_answers'),
    path('admin/stats', views.get_stats, name='admin_stats'),
]

