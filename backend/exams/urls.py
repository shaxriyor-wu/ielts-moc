from django.urls import path
from . import views

urlpatterns = [
    # Old variant endpoints (keeping for backward compatibility)
    path('admin/tests', views.variant_list_create, name='variant_list_create'),
    path('admin/tests/<int:variant_id>', views.variant_detail, name='variant_detail'),
    path('admin/tests/<int:variant_id>/generate-code', views.generate_code, name='generate_code'),
    path('admin/tests/<int:variant_id>/start-mock', views.start_mock, name='start_mock'),
    path('admin/tests/<int:variant_id>/stop-mock', views.stop_mock, name='stop_mock'),
    path('admin/tests/upload', views.upload_test_file, name='upload_test_file'),
    path('admin/tests/answers', views.create_answers, name='create_answers'),
    path('admin/stats', views.get_stats, name='admin_stats'),
    path('admin/test-keys', views.get_test_keys, name='admin_test_keys'),

    # New mock test endpoints (JSON-based variants)
    path('admin/mock-tests/available-variants', views.get_available_variants_count, name='available_variants_count'),
    path('admin/mock-tests/create', views.create_mock_test, name='create_mock_test'),
    path('admin/mock-tests/list', views.get_mock_test_list, name='mock_test_list'),

    # Student endpoints
    path('student/test/<str:test_id>', views.get_student_test_content, name='student_test_content'),
]

