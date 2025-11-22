#!/bin/bash

# Start script for Secure Notes Platform

echo "🚀 Starting Secure Notes Platform..."
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from .env.example..."
    cp backend/.env.example backend/.env
fi

# Check if database exists
if [ ! -f "backend/dev.db" ]; then
    echo "⚠️  Database not found. Running migrations..."
    cd backend
    npx prisma migrate dev --name init
    cd ..
fi

echo "✅ Starting both servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev


