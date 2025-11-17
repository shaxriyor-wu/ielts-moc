from django.urls import path
from . import views

urlpatterns = [
    path('student/enter-test-code', views.enter_test_code, name='enter_test_code'),
    path('student/queue-status', views.check_queue_status, name='check_queue_status'),
    path('student/start-test', views.start_test, name='start_test'),
    path('student/leave-queue', views.leave_queue, name='leave_queue'),
    path('student/access', views.enter_test_code, name='access_test'),
    path('student/test', views.get_current_test, name='get_current_test'),
    path('student/attempt', views.get_current_attempt, name='get_current_attempt'),
    path('student/answers/reading', views.save_reading_answers, name='save_reading_answers'),
    path('student/answers/listening', views.save_listening_answers, name='save_listening_answers'),
    path('student/answers/writing', views.save_writing, name='save_writing'),
    path('student/answers/writing-task', views.save_writing_task, name='save_writing_task'),
    path('student/highlights', views.save_highlights, name='save_highlights'),
    path('student/submit', views.submit_test, name='submit_test'),
    path('student/profile', views.profile, name='profile'),
    path('student/stats', views.get_stats, name='get_stats'),
    path('student/attempts', views.get_attempts, name='get_attempts'),
    path('student/tests', views.get_tests, name='get_tests'),
    path('student/all-tests', views.get_all_tests, name='get_all_tests'),
]

