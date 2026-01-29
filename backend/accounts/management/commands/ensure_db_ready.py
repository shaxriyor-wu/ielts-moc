"""
Management command to ensure database is ready (migrations run, data loaded).
This can be called on startup or manually to fix database issues.
"""
import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Ensure database is ready: run migrations and initialize data if needed'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-migrate',
            action='store_true',
            help='Force migration even if already applied'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('Ensuring Database is Ready'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        
        # Step 1: Check database connection
        self.stdout.write('\n[1/4] Checking database connection...')
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS('✓ Database connection OK'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Database connection failed: {e}'))
            raise
        
        # Step 2: Run migrations
        self.stdout.write('\n[2/4] Running migrations...')
        try:
            call_command('migrate', verbosity=1, interactive=False)
            self.stdout.write(self.style.SUCCESS('✓ Migrations completed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Migration failed: {e}'))
            raise
        
        # Step 3: Check if tables exist
        self.stdout.write('\n[3/4] Verifying tables exist...')
        try:
            from accounts.models import CustomUser
            # Try to query the table
            CustomUser.objects.exists()
            self.stdout.write(self.style.SUCCESS('✓ Database tables exist'))
        except Exception as e:
            error_str = str(e).lower()
            if 'does not exist' in error_str or 'no such table' in error_str:
                self.stdout.write(self.style.ERROR('✗ Tables do not exist after migration!'))
                self.stdout.write(self.style.WARNING('This might indicate a migration issue.'))
                raise
            else:
                self.stdout.write(self.style.WARNING(f'⚠ Warning checking tables: {e}'))
        
        # Step 4: Initialize data if needed
        self.stdout.write('\n[4/4] Checking if data needs to be loaded...')
        try:
            from accounts.models import CustomUser
            user_count = CustomUser.objects.count()
            
            if user_count == 0:
                self.stdout.write('  Database is empty. Loading initial data...')
                try:
                    call_command('load_initial_data', verbosity=1)
                    self.stdout.write(self.style.SUCCESS('✓ Initial data loaded'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ Failed to load initial data: {e}'))
                    self.stdout.write('  Will create default users instead...')
                
                # Always ensure default users exist
                call_command('init_users', verbosity=1)
                self.stdout.write(self.style.SUCCESS('✓ Default users initialized'))
            else:
                self.stdout.write(f'  Database already has {user_count} users')
                # Still ensure default users exist (uses get_or_create)
                call_command('init_users', verbosity=0)
                self.stdout.write(self.style.SUCCESS('✓ Default users verified'))
                
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠ Error checking/loading data: {e}'))
            # Try to at least create default users
            try:
                call_command('init_users', verbosity=1)
            except Exception as init_error:
                self.stdout.write(self.style.ERROR(f'✗ Failed to initialize users: {init_error}'))
        
        # Final summary
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('Database is ready!'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        
        # Show final status
        try:
            from accounts.models import CustomUser
            user_count = CustomUser.objects.count()
            self.stdout.write(f'\nFinal status:')
            self.stdout.write(f'  Users in database: {user_count}')
        except:
            pass

