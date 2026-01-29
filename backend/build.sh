#!/bin/bash
# Build script for Railway/Render deployment

set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

echo "Loading initial data (if database is empty)..."
python manage.py load_initial_data || echo "Initial data loading skipped, continuing..."

echo "Ensuring default users exist..."
python manage.py init_users

echo "Build completed successfully!"

