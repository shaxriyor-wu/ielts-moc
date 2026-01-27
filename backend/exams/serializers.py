from rest_framework import serializers
from .models import Variant, TestFile, Answer, MockTest, StudentTestSession


class TestFileSerializer(serializers.ModelSerializer):
    """Serializer for TestFile model."""
    
    class Meta:
        model = TestFile
        fields = ('id', 'variant', 'file_type', 'task_number', 'file', 'audio_file', 'questions_data', 'created_at')
        read_only_fields = ('id', 'created_at')


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for Answer model."""
    
    class Meta:
        model = Answer
        fields = ('id', 'variant', 'section', 'question_number', 'correct_answer')
        read_only_fields = ('id',)


class VariantSerializer(serializers.ModelSerializer):
    """Serializer for Variant model."""
    test_files = TestFileSerializer(many=True, read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Variant
        fields = (
            'id', 'name', 'code', 'duration_minutes', 'created_at', 
            'updated_at', 'created_by', 'is_active', 'test_files', 'answers'
        )
        read_only_fields = ('id', 'code', 'created_at', 'updated_at')


class VariantListSerializer(serializers.ModelSerializer):
    """Simplified serializer for variant listing."""
    
    class Meta:
        model = Variant
        fields = ('id', 'name', 'code', 'duration_minutes', 'created_at', 'is_active')
        read_only_fields = ('id', 'code', 'created_at')


class VariantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating variants."""

    class Meta:
        model = Variant
        fields = ('name', 'duration_minutes', 'is_active')


class MockTestSerializer(serializers.ModelSerializer):
    """Serializer for MockTest model."""
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)

    class Meta:
        model = MockTest
        fields = (
            'id', 'test_id', 'variant_strategy', 'selected_variants',
            'duration_minutes', 'created_by', 'created_by_email',
            'created_at', 'is_active'
        )
        read_only_fields = ('id', 'test_id', 'created_at')


class MockTestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating MockTest."""

    class Meta:
        model = MockTest
        fields = ('variant_strategy', 'duration_minutes')


class StudentTestSessionSerializer(serializers.ModelSerializer):
    """Serializer for StudentTestSession model."""
    student_email = serializers.EmailField(source='student.email', read_only=True)
    test_id = serializers.CharField(source='mock_test.test_id', read_only=True)

    class Meta:
        model = StudentTestSession
        fields = (
            'id', 'mock_test', 'test_id', 'student', 'student_email',
            'assigned_variants', 'status', 'started_at', 'completed_at',
            'current_section'
        )
        read_only_fields = ('id', 'started_at', 'completed_at')

