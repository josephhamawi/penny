#!/bin/bash

# Expense Monitor - Smart Startup Script
# This script handles cleanup and proper app startup

echo "🚀 Starting Expense Monitor..."
echo ""

# Check if watchman is installed (helps with file watching)
if ! command -v watchman &> /dev/null; then
    echo "⚠️  Watchman not installed. Consider installing for better performance:"
    echo "   brew install watchman"
    echo ""
fi

# Kill any existing Expo/Metro processes for this project
echo "🧹 Cleaning up existing processes..."
pkill -f "expo.*Expenses" 2>/dev/null || true
sleep 1

# Increase file descriptor limit
ulimit -n 4096 2>/dev/null || true

# Clear Metro bundler cache if needed
if [ "$1" == "--clear" ]; then
    echo "🗑️  Clearing cache..."
    npx expo start --clear
else
    echo "✅ Starting Expo..."
    echo ""
    echo "📱 Scan QR code with Expo Go app"
    echo "📋 Or press 'i' for iOS simulator"
    echo "📋 Or press 'a' for Android emulator"
    echo ""
    npx expo start
fi
