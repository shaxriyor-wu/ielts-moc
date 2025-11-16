"""
Management command to initialize default admin and student users.
"""
from django.core.management.base import BaseCommand
from accounts.models import CustomUser


class Command(BaseCommand):
    help = 'Initialize default admin and student users'

    def handle(self, *args, **options):
        # Create owner user
        owner_user, created = CustomUser.objects.get_or_create(
            username='owner',
            defaults={
                'email': 'owner@ielts-moc.com',
                'role': 'owner',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            owner_user.set_password('owner123')
            owner_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created owner user: owner/owner123')
            )
        else:
            # Update password if user exists
            owner_user.set_password('owner123')
            owner_user.role = 'owner'
            owner_user.is_staff = True
            owner_user.is_superuser = True
            owner_user.save()
            self.stdout.write(
                self.style.WARNING(f'Owner user already exists. Password reset to: owner123')
            )

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
            # Update password if user exists
            admin_user.set_password('admin123')
            admin_user.role = 'admin'
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(
                self.style.WARNING(f'Admin user already exists. Password reset to: admin123')
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
            # Update password if user exists
            student_user.set_password('student123')
            student_user.role = 'student'
            student_user.save()
            self.stdout.write(
                self.style.WARNING(f'Student user already exists. Password reset to: student123')
            )

        self.stdout.write(
            self.style.SUCCESS('\nDefault users initialized successfully!')
        )

