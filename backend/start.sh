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

