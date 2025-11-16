#!/bin/bash

echo "Stopping all servers..."

# Stop Django backend
pkill -f "python manage.py runserver" 2>/dev/null
echo "✓ Django backend stopped"

# Stop Vite frontend
pkill -f "vite" 2>/dev/null
echo "✓ Vite frontend stopped"

# Kill by ports
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✓ Port 8000 freed" || true
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✓ Port 3000 freed" || true
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✓ Port 3001 freed" || true

echo ""
echo "✅ All servers stopped!"

