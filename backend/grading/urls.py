from django.urls import path
from . import views

urlpatterns = [
    path('admin/tests/<int:test_id>/grade', views.grade_student_test, name='grade_student_test'),
]

