from django.db import models
from django.utils import timezone


class StudentTest(models.Model):
    """Model for tracking student test attempts."""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]
    
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='test_attempts',
        limit_choices_to={'role': 'student'}
    )
    variant = models.ForeignKey(
        'exams.Variant',
        on_delete=models.CASCADE,
        related_name='student_tests'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='in_progress'
    )
    start_time = models.DateTimeField(auto_now_add=True)
    submission_time = models.DateTimeField(null=True, blank=True)
    time_remaining_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Remaining time in seconds when test was submitted'
    )
    
    class Meta:
        db_table = 'student_test'
        ordering = ['-start_time']
        unique_together = ['student', 'variant']
    
    def __str__(self):
        return f"{self.student.username} - {self.variant.name}"
    
    def submit(self):
        """Mark test as submitted."""
        self.status = 'submitted'
        self.submission_time = timezone.now()
        self.save()


class TestQueue(models.Model):
    """Model for managing test queue - students waiting for test assignment."""
    
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('assigned', 'Assigned'),
        ('preparation', 'Preparation'),
        ('started', 'Started'),
        ('left', 'Left'),
        ('timeout', 'Timeout'),
    ]
    
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='queue_entries',
        limit_choices_to={'role': 'student'}
    )
    test_code = models.CharField(
        max_length=6,
        help_text='6-digit test code entered by student'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='waiting'
    )
    assigned_variant = models.ForeignKey(
        'exams.Variant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_assignments'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    preparation_started_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)
    timeout_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'test_queue'
        ordering = ['joined_at']
        unique_together = ['student', 'test_code']
    
    def __str__(self):
        return f"{self.student.username} - Code: {self.test_code} - {self.status}"


class TestResponse(models.Model):
    """Model for storing student answers for each section."""
    
    SECTION_CHOICES = [
        ('reading', 'Reading'),
        ('listening', 'Listening'),
        ('writing', 'Writing'),
    ]
    
    student_test = models.ForeignKey(
        StudentTest,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    section = models.CharField(
        max_length=20,
        choices=SECTION_CHOICES,
        help_text='Section type'
    )
    question_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Question number (null for writing section)'
    )
    answer = models.TextField(
        help_text='Student answer'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'test_response'
        unique_together = ['student_test', 'section', 'question_number']
        ordering = ['section', 'question_number']
    
    def __str__(self):
        if self.question_number:
            return f"{self.student_test} - {self.section} Q{self.question_number}"
        return f"{self.student_test} - {self.section}"


class TestResult(models.Model):
    """Model for storing test scores with detailed breakdown."""
    
    student_test = models.OneToOneField(
        StudentTest,
        on_delete=models.CASCADE,
        related_name='result'
    )
    
    # Section Scores
    listening_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Listening score (0-9)'
    )
    reading_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Reading score (0-9)'
    )
    writing_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Writing score (0-9)'
    )
    writing_task1_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Writing Task 1 score (0-9)'
    )
    writing_task2_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Writing Task 2 score (0-9)'
    )
    
    # Overall Score
    overall_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Overall band score'
    )
    
    # Detailed Breakdown (JSON field for flexibility)
    listening_breakdown = models.JSONField(
        null=True,
        blank=True,
        help_text='Detailed listening score breakdown'
    )
    reading_breakdown = models.JSONField(
        null=True,
        blank=True,
        help_text='Detailed reading score breakdown'
    )
    writing_breakdown = models.JSONField(
        null=True,
        blank=True,
        help_text='Detailed writing score breakdown (AI evaluation)'
    )
    
    # Grading Information
    graded_at = models.DateTimeField(auto_now_add=True)
    graded_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_tests',
        limit_choices_to={'role': 'admin'}
    )
    
    class Meta:
        db_table = 'test_result'
        ordering = ['-graded_at']
    
    def __str__(self):
        return f"{self.student_test} - Overall: {self.overall_score or 'N/A'}"
    
    def calculate_overall_score(self):
        """Calculate overall band score from section scores."""
        scores = []
        if self.listening_score is not None:
            scores.append(float(self.listening_score))
        if self.reading_score is not None:
            scores.append(float(self.reading_score))
        if self.writing_score is not None:
            scores.append(float(self.writing_score))
        
        if scores:
            # Calculate average and round to nearest 0.5
            avg = sum(scores) / len(scores)
            self.overall_score = round(avg * 2) / 2
            self.save()
            return self.overall_score
        return None
