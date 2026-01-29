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
until python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection()" 2>/dev/null; do
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "ERROR: Database connection timeout after ${timeout} seconds"
        exit 1
    fi
    echo "  Waiting for database... ($counter/$timeout)"
    sleep 1
done
echo "✓ Database connection established"

# Run migrations (idempotent - safe to run multiple times)
echo ""
echo "Running database migrations..."
python manage.py migrate --noinput || {
    echo "ERROR: Migration failed"
    exit 1
}
echo "✓ Migrations completed"

# Check if database has users and initialize if needed
echo ""
echo "Checking if database is initialized..."
USER_COUNT=$(python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ielts_moc.settings')
django.setup()
from accounts.models import CustomUser
try:
    print(CustomUser.objects.count())
except Exception as e:
    print('0')
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    echo "Database is empty. Loading initial data..."
    python manage.py load_initial_data || {
        echo "Warning: Failed to load initial data, will create default users instead"
    }
fi

echo "Ensuring default users exist..."
python manage.py init_users || {
    echo "Warning: Failed to initialize users, but continuing..."
}

if [ "$USER_COUNT" = "0" ]; then
    # Re-check user count after initialization
    NEW_USER_COUNT=$(python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ielts_moc.settings')
django.setup()
from accounts.models import CustomUser
try:
    print(CustomUser.objects.count())
except:
    print('0')
" 2>/dev/null || echo "0")
    echo "✓ Database initialized with $NEW_USER_COUNT users"
else
    echo "✓ Database already has $USER_COUNT users"
fi

echo ""
echo "=========================================="
echo "Starting Gunicorn server..."
echo "=========================================="

# Start Gunicorn
exec gunicorn ielts_moc.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info

