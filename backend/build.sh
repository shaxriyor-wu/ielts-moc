#!/bin/bash
# Build script for Render deployment

set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

echo "Initializing users..."
python manage.py init_users

echo "Build completed successfully!"

