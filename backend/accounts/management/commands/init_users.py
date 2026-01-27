"""
Management command to initialize default admin and student users.
"""
from django.core.management.base import BaseCommand
from accounts.models import CustomUser


class Command(BaseCommand):
    help = 'Initialize default admin and student users'

    def handle(self, *args, **options):
        # Create admin user
        admin_user, created = CustomUser.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@ielts-moc.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created admin user: admin/admin123')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Admin user already exists, skipping.')
            )

        # Create student user
        student_user, created = CustomUser.objects.get_or_create(
            username='student',
            defaults={
                'email': 'student@ielts-moc.com',
                'role': 'student',
            }
        )
        if created:
            student_user.set_password('student123')
            student_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created student user: student/student123')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Student user already exists, skipping.')
            )

        self.stdout.write(
            self.style.SUCCESS('\nDefault users initialized successfully!')
        )

