"""
Management command to load initial data from SQLite fixture to PostgreSQL.
This handles PostgreSQL-specific issues like primary key sequences.
"""
import os
import json
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Load initial data from fixture and fix PostgreSQL sequences'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fixture',
            type=str,
            default='fixtures/db_dump.json',
            help='Path to fixture file (default: fixtures/db_dump.json)'
        )

    def handle(self, *args, **options):
        fixture_path = options.get('fixture')
        
        # Check if fixture exists
        full_path = os.path.join(settings.BASE_DIR, fixture_path)
        if not os.path.exists(full_path):
            self.stdout.write(
                self.style.WARNING(f'Fixture file not found: {full_path}')
            )
            return
        
        # Check if database already has data
        from accounts.models import CustomUser
        user_count = CustomUser.objects.count()
        
        if user_count > 0:
            self.stdout.write(
                self.style.WARNING(f'Database already has {user_count} users. Skipping fixture load.')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'Loading data from {fixture_path}...')
        )
        
        try:
            # Load the fixture
            call_command('loaddata', fixture_path, verbosity=1)
            self.stdout.write(
                self.style.SUCCESS('Fixture loaded successfully!')
            )
            
            # Fix PostgreSQL sequences for primary keys
            if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                self.fix_postgresql_sequences()
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading fixture: {e}')
            )
            # Try to load just the users
            self.stdout.write(
                self.style.WARNING('Attempting to initialize default users instead...')
            )
            call_command('init_users')
    
    def fix_postgresql_sequences(self):
        """Fix PostgreSQL sequences after loading fixture data."""
        self.stdout.write('Fixing PostgreSQL sequences...')
        
        # Tables that need sequence fixes
        tables = [
            ('custom_user', 'id'),
            ('variant', 'id'),
            ('test_file', 'id'),
            ('answer', 'id'),
            ('student_test', 'id'),
            ('test_queue', 'id'),
            ('test_response', 'id'),
            ('test_result', 'id'),
            ('speaking_response', 'id'),
            ('mock_test', 'id'),
            ('student_test_session', 'id'),
        ]
        
        with connection.cursor() as cursor:
            for table_name, pk_column in tables:
                try:
                    # Check if table exists
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = %s
                        );
                    """, [table_name])
                    table_exists = cursor.fetchone()[0]
                    
                    if not table_exists:
                        continue
                    
                    # Get the max id
                    cursor.execute(f"SELECT MAX({pk_column}) FROM {table_name}")
                    max_id = cursor.fetchone()[0]
                    
                    if max_id:
                        # Reset the sequence
                        sequence_name = f"{table_name}_{pk_column}_seq"
                        cursor.execute(f"SELECT setval('{sequence_name}', %s, true)", [max_id])
                        self.stdout.write(f'  Fixed sequence for {table_name}: next id = {max_id + 1}')
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'  Could not fix sequence for {table_name}: {e}')
                    )
        
        self.stdout.write(self.style.SUCCESS('Sequences fixed!'))

