#!/bin/bash
# Startup script for Railway deployment
# Ensures database is migrated and initialized before starting the server

set -e

echo "=========================================="
echo "Starting IELTS MOC Application"
echo "=========================================="

cd "$(dirname "$0")"

# Wait for database to be ready (with timeout)
echo ""
echo "Waiting for database connection..."
timeout=30
counter=0
until python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection()" 2>&1; do
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "ERROR: Database connection timeout after ${timeout} seconds"
        echo "DEBUG: DATABASE_URL=${DATABASE_URL:0:30}..."
        echo "DEBUG: which python=$(which python)"
        python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection()" 2>&1 || true
        exit 1
    fi
    if [ $counter -eq 1 ] || [ $counter -eq 10 ]; then
        echo "  DB connection error (attempt $counter):"
        python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection()" 2>&1 || true
    fi
    echo "  Waiting for database... ($counter/$timeout)"
    sleep 1
done
echo "✓ Database connection established"

# Ensure database is ready (migrations + data initialization)
echo ""
echo "Ensuring database is ready..."
if ! python manage.py ensure_db_ready; then
    echo ""
    echo "=========================================="
    echo "ERROR: Database initialization failed!"
    echo "=========================================="
    echo ""
    echo "Attempting to run migrations manually..."
    python manage.py migrate --noinput || {
        echo "ERROR: Migrations failed"
        exit 1
    }
    echo "✓ Migrations completed manually"
    
    echo ""
    echo "Attempting to initialize users..."
    python manage.py init_users || {
        echo "WARNING: User initialization failed, but continuing..."
    }
fi
echo "✓ Database ready"

# Initialize media files if volume is mounted
echo ""
echo "Initializing media files..."
echo "MEDIA_VOLUME_PATH: ${MEDIA_VOLUME_PATH:-not set}"
echo "Current directory: $(pwd)"

# Determine destination (volume mount point or default)
DEST_DIR="${MEDIA_VOLUME_PATH:-/app/media}"
echo "Media destination (MEDIA_ROOT): $DEST_DIR"

# Create destination directories
mkdir -p "$DEST_DIR"
mkdir -p "$DEST_DIR/audio_files"
mkdir -p "$DEST_DIR/test_files"
mkdir -p "$DEST_DIR/speaking_audio"

# Source directory - media files backed up during build phase
# Volume mount hides original files, so we use backup from /opt/media_backup
# (also check legacy /app/media_bundled for backward compatibility)
SOURCE_DIR=""
POSSIBLE_SOURCES=(
    "/opt/media_backup"               # Primary backup (outside any volume mount)
    "/app/media_bundled"              # Legacy backup location
)

for possible_source in "${POSSIBLE_SOURCES[@]}"; do
    if [ -d "$possible_source" ] && [ "$(ls -A "$possible_source" 2>/dev/null)" ]; then
        SOURCE_DIR="$possible_source"
        echo "Found media source at: $SOURCE_DIR"
        break
    else
        echo "Source not found or empty: $possible_source"
    fi
done

# Check if destination already has the critical files
if [ -z "$SOURCE_DIR" ]; then
    if [ -f "$DEST_DIR/audio_files/listening.m4a" ]; then
        echo "Media files already present in destination"
    else
        echo "WARNING: No media source directory found!"
        echo "  /opt contents:" && ls -la /opt 2>/dev/null || echo "  (not accessible)"
        echo "  /app contents:" && ls -la /app 2>/dev/null || echo "  (not accessible)"
    fi
fi

# Copy media files if source exists and is different from destination
if [ -n "$SOURCE_DIR" ]; then
    echo "Copying media files from $SOURCE_DIR to $DEST_DIR..."
    
    # Use rsync if available, otherwise cp
    if command -v rsync &> /dev/null; then
        rsync -av --ignore-existing "$SOURCE_DIR/" "$DEST_DIR/"
    else
        # Copy files preserving structure, only if they don't exist
        cp -rn "$SOURCE_DIR"/* "$DEST_DIR/" 2>/dev/null || {
            # If cp -n not supported, do it manually
            for item in "$SOURCE_DIR"/*; do
                if [ -e "$item" ]; then
                    item_name=$(basename "$item")
                    if [ ! -e "$DEST_DIR/$item_name" ]; then
                        cp -r "$item" "$DEST_DIR/"
                        echo "  Copied: $item_name"
                    else
                        echo "  Skipped (exists): $item_name"
                    fi
                fi
            done
        }
    fi
    
    echo "✓ Media files copied to volume"
fi

# Also try the management command for more thorough initialization
python manage.py init_media_files 2>/dev/null || true

# Verify critical files
echo ""
echo "Verifying media files..."
echo "Contents of $DEST_DIR:"
ls -la "$DEST_DIR" 2>/dev/null || echo "  (directory not accessible)"

if [ -f "$DEST_DIR/audio_files/listening.m4a" ]; then
    echo "✓ listening.m4a found"
    ls -la "$DEST_DIR/audio_files/listening.m4a"
else
    echo "✗ listening.m4a NOT found at $DEST_DIR/audio_files/"
    echo "  Contents of $DEST_DIR/audio_files:"
    ls -la "$DEST_DIR/audio_files" 2>/dev/null || echo "  (directory not accessible or empty)"
    
    # Last resort: try to find the file anywhere
    echo "  Searching for listening.m4a in /app..."
    find /app -name "listening.m4a" 2>/dev/null || echo "  (not found)"
fi

echo ""
echo "=========================================="
echo "Starting Gunicorn server..."
echo "=========================================="

# Start Gunicorn with WSGI wrapper that ensures DB is ready
exec gunicorn ielts_moc.wsgi_init:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info

