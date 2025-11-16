#!/bin/bash

# Django Backend Setup Script

echo "Setting up Django backend..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
DB_NAME=ielts_moc
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
EOF
    echo ".env file created. Please update with your database credentials."
fi

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Initialize default users
echo "Initializing default users..."
python manage.py init_users

echo "Setup complete!"
echo ""
echo "To start the server, run:"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"

