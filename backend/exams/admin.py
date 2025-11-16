from django.contrib import admin
from .models import Variant, TestFile, Answer


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'duration_minutes', 'is_active', 'created_at', 'created_by')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code')
    readonly_fields = ('code', 'created_at', 'updated_at')


@admin.register(TestFile)
class TestFileAdmin(admin.ModelAdmin):
    list_display = ('variant', 'file_type', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('variant__name', 'variant__code')


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('variant', 'section', 'question_number', 'correct_answer')
    list_filter = ('section', 'variant')
    search_fields = ('variant__name', 'variant__code')

