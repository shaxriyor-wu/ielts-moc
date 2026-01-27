from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
import random
import string


def generate_variant_code():
    """Generate a unique 6-digit code for variant."""
    while True:
        code = ''.join(random.choices(string.digits, k=6))
        if not Variant.objects.filter(code=code).exists():
            return code


class Variant(models.Model):
    """Test variant model."""
    
    name = models.CharField(max_length=200, help_text='Variant name')
    code = models.CharField(
        max_length=6,
        unique=True,
        default=generate_variant_code,
        help_text='Unique 6-digit code'
    )
    duration_minutes = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Test duration in minutes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_variants'
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'variant'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class TestFile(models.Model):
    """Model for storing Reading, Listening, Writing, and Speaking test files."""

    FILE_TYPE_CHOICES = [
        ('reading', 'Reading'),
        ('listening', 'Listening'),
        ('writing', 'Writing'),
        ('speaking', 'Speaking'),
    ]
    
    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        related_name='test_files'
    )
    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPE_CHOICES,
        help_text='Type of test file'
    )
    task_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Task number for writing section (1 or 2), null for other sections'
    )
    file = models.FileField(
        upload_to='test_files/%Y/%m/%d/',
        help_text='Test file (PDF, DOCX, etc.)'
    )
    audio_file = models.FileField(
        upload_to='audio_files/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Audio file for listening section (optional)'
    )
    questions_data = models.JSONField(
        null=True,
        blank=True,
        help_text='Structured question data in JSON format'
    )
    duration_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Duration for this section in minutes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'test_file'
        unique_together = ['variant', 'file_type', 'task_number']
    
    def __str__(self):
        if self.file_type == 'writing' and self.task_number:
            return f"{self.variant.name} - {self.get_file_type_display()} Task {self.task_number}"
        return f"{self.variant.name} - {self.get_file_type_display()}"


class Answer(models.Model):
    """Model for storing correct answers for Reading and Listening sections."""

    SECTION_CHOICES = [
        ('reading', 'Reading'),
        ('listening', 'Listening'),
    ]

    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    section = models.CharField(
        max_length=20,
        choices=SECTION_CHOICES,
        help_text='Section type'
    )
    question_number = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Question number'
    )
    correct_answer = models.CharField(
        max_length=200,
        help_text='Correct answer (e.g., A, B, C, D, TRUE, FALSE, etc.)'
    )
    alternative_answers = models.JSONField(
        null=True,
        blank=True,
        help_text='Alternative acceptable answers (array of strings)'
    )
    case_sensitive = models.BooleanField(
        default=False,
        help_text='Whether answer matching should be case-sensitive'
    )

    class Meta:
        db_table = 'answer'
        unique_together = ['variant', 'section', 'question_number']
        ordering = ['section', 'question_number']

    def __str__(self):
        return f"{self.variant.code} - {self.section} Q{self.question_number}: {self.correct_answer}"


class MockTest(models.Model):
    """Mock test with JSON-based variants."""

    VARIANT_STRATEGY_CHOICES = [
        ('same', 'Same variant for all students'),
        ('unique', 'Unique variant for each student'),
    ]

    test_id = models.CharField(
        max_length=6,
        unique=True,
        help_text='Unique 6-digit test ID'
    )
    variant_strategy = models.CharField(
        max_length=10,
        choices=VARIANT_STRATEGY_CHOICES,
        help_text='How variants are distributed to students'
    )
    selected_variants = models.JSONField(
        null=True,
        blank=True,
        help_text='Pre-selected variants for "same" strategy'
    )
    duration_minutes = models.PositiveIntegerField(
        default=180,
        validators=[MinValueValidator(1)],
        help_text='Total test duration in minutes'
    )
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_mock_tests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'mock_test'
        ordering = ['-created_at']

    def __str__(self):
        return f"Mock Test {self.test_id} ({self.get_variant_strategy_display()})"


class StudentTestSession(models.Model):
    """Individual student test session."""

    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    mock_test = models.ForeignKey(
        MockTest,
        on_delete=models.CASCADE,
        related_name='student_sessions'
    )
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='test_sessions'
    )
    assigned_variants = models.JSONField(
        help_text='Assigned variant files for this student'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='waiting'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    current_section = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='Current section student is on'
    )

    class Meta:
        db_table = 'student_test_session'
        unique_together = ['mock_test', 'student']
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.email} - Test {self.mock_test.test_id}"

