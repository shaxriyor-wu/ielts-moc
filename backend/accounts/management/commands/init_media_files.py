"""
Django management command to initialize media files in production volume.
Copies media files from source directory to MEDIA_ROOT if volume is mounted.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import os
import shutil
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Initialize media files in production volume'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            default=None,
            help='Source directory for media files (default: backend/media)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force copy even if files already exist'
        )

    def handle(self, *args, **options):
        source_dir = options.get('source')
        force = options.get('force', False)
        
        # Default source is backend/media relative to BASE_DIR
        # Also check parent directory (for Railway deployment structure)
        if not source_dir:
            possible_sources = [
                os.path.join(settings.BASE_DIR, 'media'),
                os.path.join(settings.BASE_DIR.parent, 'backend', 'media'),
                '/app/backend/media',  # Railway default path
            ]
            
            for src in possible_sources:
                if os.path.exists(src) and os.path.isdir(src):
                    source_dir = src
                    break
            
            if not source_dir:
                source_dir = os.path.join(settings.BASE_DIR, 'media')
        
        media_root = settings.MEDIA_ROOT
        
        self.stdout.write(f'Source directory: {source_dir}')
        self.stdout.write(f'Media root (destination): {media_root}')
        
        # Check if source exists
        if not os.path.exists(source_dir):
            self.stdout.write(self.style.WARNING(
                f'Source directory does not exist: {source_dir}'
            ))
            self.stdout.write('Skipping media file initialization.')
            return
        
        # Check if media root exists
        if not os.path.exists(media_root):
            self.stdout.write(f'Creating media root directory: {media_root}')
            os.makedirs(media_root, exist_ok=True)
        
        # Copy files
        copied_count = 0
        skipped_count = 0
        error_count = 0
        
        def copy_tree(src, dst):
            """Recursively copy directory tree."""
            nonlocal copied_count, skipped_count, error_count
            
            if not os.path.exists(src):
                return
            
            if os.path.isfile(src):
                # Copy single file
                dst_dir = os.path.dirname(dst)
                if dst_dir and not os.path.exists(dst_dir):
                    os.makedirs(dst_dir, exist_ok=True)
                
                if os.path.exists(dst) and not force:
                    skipped_count += 1
                    return
                
                try:
                    shutil.copy2(src, dst)
                    copied_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'Error copying {src} to {dst}: {e}'
                    ))
                    error_count += 1
            else:
                # Copy directory
                if not os.path.exists(dst):
                    os.makedirs(dst, exist_ok=True)
                
                for item in os.listdir(src):
                    src_path = os.path.join(src, item)
                    dst_path = os.path.join(dst, item)
                    copy_tree(src_path, dst_path)
        
        # Copy all files from source to media root
        self.stdout.write('Copying media files...')
        copy_tree(source_dir, media_root)
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Media file initialization complete!'
        ))
        self.stdout.write(f'  Copied: {copied_count} files')
        self.stdout.write(f'  Skipped: {skipped_count} files (already exist)')
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'  Errors: {error_count} files'))
        
        # Verify critical files
        critical_files = [
            'audio_files/listening.m4a',
        ]
        
        self.stdout.write('')
        self.stdout.write('Verifying critical files...')
        for rel_path in critical_files:
            full_path = os.path.join(media_root, rel_path)
            if os.path.exists(full_path):
                self.stdout.write(self.style.SUCCESS(f'  ✓ {rel_path}'))
            else:
                self.stdout.write(self.style.WARNING(f'  ✗ {rel_path} (not found)'))

