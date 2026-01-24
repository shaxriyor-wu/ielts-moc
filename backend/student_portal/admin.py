from django.contrib import admin
from .models import StudentTest, TestResponse, TestResult, TestQueue, SpeakingResponse


@admin.register(StudentTest)
class StudentTestAdmin(admin.ModelAdmin):
    list_display = ('student', 'variant', 'status', 'start_time', 'submission_time')
    list_filter = ('status', 'start_time')
    search_fields = ('student__username', 'variant__name', 'variant__code')


@admin.register(TestResponse)
class TestResponseAdmin(admin.ModelAdmin):
    list_display = ('student_test', 'section', 'question_number', 'created_at')
    list_filter = ('section', 'created_at')
    search_fields = ('student_test__student__username', 'student_test__variant__name')


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('student_test', 'listening_score', 'reading_score', 'writing_score', 'speaking_score', 'overall_score', 'graded_at')
    list_filter = ('graded_at',)
    search_fields = ('student_test__student__username', 'student_test__variant__name')


@admin.register(TestQueue)
class TestQueueAdmin(admin.ModelAdmin):
    list_display = ('student', 'test_code', 'status', 'assigned_variant', 'joined_at', 'assigned_at')
    list_filter = ('status', 'joined_at')
    search_fields = ('student__username', 'test_code', 'assigned_variant__name')

