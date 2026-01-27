#!/bin/bash
# Full-stack build script for Railway deployment
set -o errexit

echo "=========================================="
echo "Building Full-Stack Application"
echo "=========================================="

# Build React Frontend
echo ""
echo "Step 1: Building React Frontend..."
cd frontend
npm ci
npm run build
cd ..
echo "Frontend build completed"

# Install Python Dependencies
echo ""
echo "Step 2: Installing Python Dependencies..."
pip install -r backend/requirements.txt
echo "Python dependencies installed"

# Collect Static Files (including React build)
echo ""
echo "Step 3: Collecting Static Files..."
cd backend
python manage.py collectstatic --noinput
echo "Static files collected"

# Run Database Migrations
echo ""
echo "Step 4: Running Database Migrations..."
python manage.py migrate --noinput
echo "Migrations completed"

# Initialize Default Users (only creates if not existing)
echo ""
echo "Step 5: Initializing Default Users..."
python manage.py init_users
echo "Users initialized"

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
