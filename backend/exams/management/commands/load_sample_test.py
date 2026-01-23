"""
Django management command to load sample IELTS tests from JSON files.

Usage:
    python manage.py load_sample_test
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from exams.models import Variant, TestFile, Answer
from exams.test_structures import create_test_from_json
import json
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Load sample IELTS test from JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='exams/sample_tests/cambridge_ielts_8_test1.json',
            help='Path to JSON file (relative to project root or absolute)'
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@example.com',
            help='Email of admin user who will be set as creator'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        admin_email = options['admin_email']

        # Get admin user
        try:
            admin_user = User.objects.get(email=admin_email, role='admin')
        except User.DoesNotExist:
            # Try to find any admin user
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                self.stdout.write(self.style.WARNING(
                    f'No admin user found. Please create an admin user first.'
                ))
                self.stdout.write('You can create one using:')
                self.stdout.write('  python manage.py createsuperuser')
                return
            else:
                self.stdout.write(self.style.SUCCESS(
                    f'Using existing admin user: {admin_user.email}'
                ))

        # Load JSON file
        if not os.path.isabs(file_path):
            # Try relative to project root
            from django.conf import settings
            file_path = os.path.join(settings.BASE_DIR, file_path)

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        self.stdout.write(f'Loading test from: {file_path}')

        with open(file_path, 'r') as f:
            test_data = json.load(f)

        # Parse test structure
        try:
            test = create_test_from_json(test_data)
        except ValueError as e:
            self.stdout.write(self.style.ERROR(f'Invalid test structure: {e}'))
            return

        # Create Variant
        variant, created = Variant.objects.get_or_create(
            name=test.variant_name,
            defaults={
                'duration_minutes': 180,  # 3 hours total
                'created_by': admin_user,
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(
                f'Created variant: {variant.name} (Code: {variant.code})'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f'Variant already exists: {variant.name} (Code: {variant.code})'
            ))
            # Clear existing test files and answers
            variant.test_files.all().delete()
            variant.answers.all().delete()
            self.stdout.write('Cleared existing test data')

        # Create Listening section
        if test.listening:
            listening_data = test.listening.to_dict()
            audio_file_path = None
            if test.listening.audio_url and not test.listening.audio_url.startswith(('http://', 'https://', '/')):
                audio_file_path = test.listening.audio_url
            elif test.listening.audio_url and test.listening.audio_url.startswith('audio_files/'):
                audio_file_path = test.listening.audio_url

            test_file = TestFile.objects.create(
                variant=variant,
                file_type='listening',
                questions_data=listening_data,
                duration_minutes=test.listening.duration_minutes,
                file='placeholder.pdf',
                audio_file=audio_file_path
            )
            self.stdout.write(self.style.SUCCESS(
                f'Created Listening section with {test.listening.total_questions} questions'
            ))

            # Create answer keys
            for q_num, answer in test.listening_answers.items():
                Answer.objects.create(
                    variant=variant,
                    section='listening',
                    question_number=int(q_num),
                    correct_answer=str(answer) if not isinstance(answer, list) else str(answer[0]),
                    alternative_answers=answer if isinstance(answer, list) and len(answer) > 1 else None
                )
            self.stdout.write(f'Created {len(test.listening_answers)} listening answers')

        # Create Reading section
        if test.reading:
            reading_data = test.reading.to_dict()
            test_file = TestFile.objects.create(
                variant=variant,
                file_type='reading',
                questions_data=reading_data,
                duration_minutes=test.reading.duration_minutes,
                file='placeholder.pdf'
            )
            self.stdout.write(self.style.SUCCESS(
                f'Created Reading section with {test.reading.total_questions} questions'
            ))

            # Create answer keys
            for q_num, answer in test.reading_answers.items():
                Answer.objects.create(
                    variant=variant,
                    section='reading',
                    question_number=int(q_num),
                    correct_answer=str(answer) if not isinstance(answer, list) else str(answer[0]),
                    alternative_answers=answer if isinstance(answer, list) and len(answer) > 1 else None
                )
            self.stdout.write(f'Created {len(test.reading_answers)} reading answers')

        # Create Writing section
        if test.writing:
            writing_data = test.writing.to_dict()
            
            # Task 1
            if test.writing.task1:
                TestFile.objects.create(
                    variant=variant,
                    file_type='writing',
                    task_number=1,
                    questions_data=test.writing.task1.to_dict(),
                    duration_minutes=test.writing.task1.duration_minutes,
                    file='placeholder.pdf'
                )
                self.stdout.write(self.style.SUCCESS('Created Writing Task 1'))

            # Task 2
            if test.writing.task2:
                TestFile.objects.create(
                    variant=variant,
                    file_type='writing',
                    task_number=2,
                    questions_data=test.writing.task2.to_dict(),
                    duration_minutes=test.writing.task2.duration_minutes,
                    file='placeholder.pdf'
                )
                self.stdout.write(self.style.SUCCESS('Created Writing Task 2'))

        # Create Speaking section
        if test.speaking:
            speaking_data = test.speaking.to_dict()
            TestFile.objects.create(
                variant=variant,
                file_type='speaking',
                questions_data=speaking_data,
                duration_minutes=test.speaking.total_duration_minutes,
                file='placeholder.pdf'
            )
            self.stdout.write(self.style.SUCCESS('Created Speaking section'))

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Successfully loaded test: {variant.name}'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'✓ Test Code: {variant.code}'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'✓ Students can access this test using the code above'
        ))
