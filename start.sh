#!/bin/bash

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Stop any running servers
echo "Stopping any running servers..."
pkill -f "python manage.py runserver" 2>/dev/null
pkill -f "vite" 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

sleep 1

echo ""
echo "Starting Django backend..."
cd "$ROOT_DIR/backend"
source venv/bin/activate
python manage.py runserver > /tmp/django.log 2>&1 &
BACKEND_PID=$!

sleep 3

echo "Starting React frontend..."
cd "$ROOT_DIR/client"
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Servers started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000 (or 3001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/django.log"
echo "  Frontend: tail -f /tmp/vite.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "python manage.py runserver" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait

