"""
Management command to migrate data from SQLite to PostgreSQL.

This command:
1. Connects to SQLite database
2. Exports all data using Django's serialization
3. Connects to PostgreSQL database
4. Imports all data preserving relationships

Usage:
    python manage.py migrate_to_postgresql
    
    # With custom database URLs:
    python manage.py migrate_to_postgresql --sqlite-path /path/to/db.sqlite3 --postgres-url postgresql://user:pass@host:port/dbname
"""

import os
import sys
import tempfile
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.db import connections, transaction
from django.conf import settings
import dj_database_url


class Command(BaseCommand):
    help = 'Migrate data from SQLite database to PostgreSQL database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-path',
            type=str,
            default=None,
            help='Path to SQLite database file (default: db.sqlite3 in project root)'
        )
        parser.add_argument(
            '--postgres-url',
            type=str,
            default=None,
            help='PostgreSQL database URL (default: from DATABASE_URL env or settings)'
        )
        parser.add_argument(
            '--skip-migrations',
            action='store_true',
            help='Skip running migrations on PostgreSQL (use if already migrated)'
        )
        parser.add_argument(
            '--clear-postgres',
            action='store_true',
            help='Clear all data from PostgreSQL before importing (WARNING: destructive)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('SQLite to PostgreSQL Migration Tool'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        
        # Step 1: Setup SQLite connection
        sqlite_path = options.get('sqlite_path')
        if not sqlite_path:
            sqlite_path = Path(settings.BASE_DIR) / 'db.sqlite3'
        
        if not os.path.exists(sqlite_path):
            raise CommandError(f'SQLite database not found at: {sqlite_path}')
        
        self.stdout.write(self.style.SUCCESS(f'\n[1/5] Found SQLite database: {sqlite_path}'))
        
        # Configure SQLite database connection
        sqlite_db_config = {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(sqlite_path),
        }
        
        # Step 2: Setup PostgreSQL connection
        postgres_url = options.get('postgres_url') or os.getenv('DATABASE_URL')
        
        if not postgres_url:
            # Try to get from settings
            default_db = settings.DATABASES.get('default', {})
            if default_db.get('ENGINE') == 'django.db.backends.postgresql':
                self.stdout.write(self.style.WARNING(
                    'No DATABASE_URL found, using PostgreSQL config from settings'
                ))
                postgres_db_config = default_db
            else:
                raise CommandError(
                    'PostgreSQL connection not found. Please provide --postgres-url or set DATABASE_URL environment variable.'
                )
        else:
            postgres_db_config = dj_database_url.parse(postgres_url, conn_max_age=600)
        
        self.stdout.write(self.style.SUCCESS(f'\n[2/5] PostgreSQL connection configured'))
        
        # Step 3: Export data from SQLite
        self.stdout.write(self.style.SUCCESS('\n[3/5] Exporting data from SQLite...'))
        
        # Create temporary file for data export
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp_file:
            tmp_export_path = tmp_file.name
        
        try:
            # Step 3a: Export from SQLite using environment variable approach
            # Temporarily set SQLite as the database via environment
            original_db_url = os.environ.get('DATABASE_URL')
            
            # Save original database config
            original_databases = settings.DATABASES.copy()
            
            # Configure SQLite as default for export
            # Note: We modify settings.DATABASES directly, which works in management commands
            # because they run before Django fully initializes connections
            settings.DATABASES['default'] = sqlite_db_config
            settings.DATABASES['sqlite_source'] = sqlite_db_config
            
            # Close existing connections and clear connection cache
            connections.close_all()
            # Force Django to recognize the new database configuration
            if 'default' in connections._databases:
                del connections._databases['default']
            
            # List of apps to export
            apps_to_export = [
                'accounts',
                'exams',
                'student_portal',
                'grading',
                'contenttypes',  # Django content types
                'auth',  # Django auth (permissions, groups)
                'sessions',  # Django sessions
            ]
            
            # Export data from SQLite
            self.stdout.write('  Exporting apps: ' + ', '.join(apps_to_export))
            try:
                # Redirect stdout to file
                import sys
                original_stdout = sys.stdout
                with open(tmp_export_path, 'w') as f:
                    sys.stdout = f
                    try:
                        call_command(
                            'dumpdata',
                            *apps_to_export,
                            natural_foreign=True,
                            natural_primary=True,
                            verbosity=0,
                            format='json'
                        )
                    finally:
                        sys.stdout = original_stdout
            except Exception as e:
                # Try without natural keys if that fails
                self.stdout.write(self.style.WARNING(f'  Retrying without natural keys: {e}'))
                import sys
                original_stdout = sys.stdout
                with open(tmp_export_path, 'w') as f:
                    sys.stdout = f
                    try:
                        call_command(
                            'dumpdata',
                            *apps_to_export,
                            verbosity=0,
                            format='json'
                        )
                    finally:
                        sys.stdout = original_stdout
            
            # Get file size and check if data was exported
            export_size = os.path.getsize(tmp_export_path)
            if export_size < 100:  # JSON should be at least some bytes
                raise CommandError('Export file is too small. Check if SQLite database has data.')
            
            self.stdout.write(self.style.SUCCESS(
                f'✓ Exported {export_size:,} bytes of data'
            ))
            
            # Step 4: Setup PostgreSQL and run migrations
            self.stdout.write(self.style.SUCCESS('\n[4/5] Setting up PostgreSQL database...'))
            
            # Configure PostgreSQL as default
            settings.DATABASES['default'] = postgres_db_config
            
            # Restore DATABASE_URL if it was set
            if original_db_url:
                os.environ['DATABASE_URL'] = original_db_url
            elif 'DATABASE_URL' in os.environ:
                del os.environ['DATABASE_URL']
            
            # Close connections again and clear connection cache
            connections.close_all()
            # Force Django to recognize the new database configuration
            if 'default' in connections._databases:
                del connections._databases['default']
            
            # Test PostgreSQL connection
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS('✓ PostgreSQL connection successful'))
            except Exception as e:
                raise CommandError(f'Failed to connect to PostgreSQL: {e}')
            
            # Run migrations if not skipped
            if not options.get('skip_migrations'):
                self.stdout.write('  Running migrations...')
                try:
                    call_command('migrate', verbosity=1, interactive=False)
                    self.stdout.write(self.style.SUCCESS('✓ Migrations completed'))
                except Exception as e:
                    raise CommandError(f'Migration failed: {e}')
            else:
                self.stdout.write(self.style.WARNING('  Skipping migrations (--skip-migrations)'))
            
            # Clear PostgreSQL data if requested
            if options.get('clear_postgres'):
                self.stdout.write(self.style.WARNING('\n  Clearing existing data from PostgreSQL...'))
                try:
                    # Delete in reverse dependency order
                    apps_to_clear = reversed(apps_to_export)
                    for app in apps_to_clear:
                        try:
                            call_command('flush', '--noinput', verbosity=0)
                            break  # flush clears everything
                        except:
                            pass
                    self.stdout.write(self.style.SUCCESS('✓ PostgreSQL data cleared'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'  Warning: Could not clear data: {e}'))
            
            # Step 5: Import data to PostgreSQL
            self.stdout.write(self.style.SUCCESS('\n[5/5] Importing data to PostgreSQL...'))
            
            try:
                with transaction.atomic():
                    # loaddata expects a file path, not a file object
                    call_command(
                        'loaddata',
                        tmp_export_path,
                        verbosity=1,
                        skip_checks=True
                    )
                
                self.stdout.write(self.style.SUCCESS('✓ Data imported successfully'))
                
            except Exception as e:
                # Try to get more details about the error
                import traceback
                error_details = traceback.format_exc()
                self.stdout.write(self.style.ERROR(f'\n✗ Import failed: {e}'))
                self.stdout.write(self.style.ERROR('\nError details:'))
                self.stdout.write(self.style.ERROR(error_details))
                
                # Check if it's a constraint violation
                if 'UNIQUE constraint' in str(e) or 'duplicate key' in str(e).lower():
                    self.stdout.write(self.style.WARNING(
                        '\nTip: Data might already exist. Use --clear-postgres to clear existing data first.'
                    ))
                
                raise CommandError(f'Failed to import data: {e}')
            
            # Final summary
            self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
            self.stdout.write(self.style.SUCCESS('Migration completed successfully!'))
            self.stdout.write(self.style.SUCCESS('=' * 70))
            
            # Show data counts
            self.stdout.write('\nData summary:')
            try:
                from accounts.models import CustomUser
                from exams.models import Variant, TestFile, Answer, MockTest, StudentTestSession
                from student_portal.models import StudentTest, TestQueue, TestResponse, TestResult, SpeakingResponse
                
                user_count = CustomUser.objects.count()
                variant_count = Variant.objects.count()
                test_file_count = TestFile.objects.count()
                answer_count = Answer.objects.count()
                mock_test_count = MockTest.objects.count()
                student_test_count = StudentTest.objects.count()
                test_result_count = TestResult.objects.count()
                
                self.stdout.write(f'  Users: {user_count}')
                self.stdout.write(f'  Variants: {variant_count}')
                self.stdout.write(f'  Test Files: {test_file_count}')
                self.stdout.write(f'  Answers: {answer_count}')
                self.stdout.write(f'  Mock Tests: {mock_test_count}')
                self.stdout.write(f'  Student Tests: {student_test_count}')
                self.stdout.write(f'  Test Results: {test_result_count}')
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Could not get data counts: {e}'))
            
        finally:
            # Restore original database settings
            settings.DATABASES = original_databases
            
            # Clean up temporary file
            try:
                if os.path.exists(tmp_export_path):
                    os.unlink(tmp_export_path)
            except:
                pass
            
            # Close all connections
            connections.close_all()

