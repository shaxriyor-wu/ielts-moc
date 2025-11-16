from rest_framework import serializers
from .models import StudentTest, TestResponse, TestResult
from exams.serializers import VariantSerializer


class TestResponseSerializer(serializers.ModelSerializer):
    """Serializer for TestResponse model."""
    
    class Meta:
        model = TestResponse
        fields = ('id', 'student_test', 'section', 'question_number', 'answer', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class StudentTestSerializer(serializers.ModelSerializer):
    """Serializer for StudentTest model."""
    variant = VariantSerializer(read_only=True)
    responses = TestResponseSerializer(many=True, read_only=True)
    
    class Meta:
        model = StudentTest
        fields = (
            'id', 'student', 'variant', 'status', 'start_time', 
            'submission_time', 'time_remaining_seconds', 'responses'
        )
        read_only_fields = ('id', 'start_time', 'submission_time')


class TestResultSerializer(serializers.ModelSerializer):
    """Serializer for TestResult model."""
    student_test = StudentTestSerializer(read_only=True)
    
    class Meta:
        model = TestResult
        fields = (
            'id', 'student_test', 'listening_score', 'reading_score', 
            'writing_score', 'writing_task1_score', 'writing_task2_score',
            'overall_score', 'listening_breakdown',
            'reading_breakdown', 'writing_breakdown', 'graded_at', 'graded_by'
        )
        read_only_fields = ('id', 'graded_at', 'graded_by')

