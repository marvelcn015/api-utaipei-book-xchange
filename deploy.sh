#!/bin/bash

# UTaipei BookXchange API Deployment Script
# For updating the application in production environment

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting deployment of UTaipei BookXchange API..."

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
pnpm install --prod=false

echo "Building project..."
pnpm run build

echo "Reloading application..."
pm2 reload ecosystem.config.js --env production

echo "Deployment completed successfully!"
pm2 status
pm2 logs utaipei-bookxchange-api --lines 20
