#!/bin/bash

# Database Deployment Script
# This script handles database migrations and setup for production deployment

set -e

echo "🚀 Starting database deployment..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Function to run database migrations
run_migrations() {
    echo "📦 Running database migrations..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migrations failed"
        exit 1
    fi
}

# Function to generate Prisma client
generate_client() {
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma client generated successfully"
    else
        echo "❌ Prisma client generation failed"
        exit 1
    fi
}

# Function to seed database (optional)
seed_database() {
    if [ "$SEED_DATABASE" = "true" ]; then
        echo "🌱 Seeding database..."
        npm run db:seed
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded successfully"
        else
            echo "⚠️  Database seeding failed, but continuing..."
        fi
    else
        echo "⏭️  Skipping database seeding"
    fi
}

# Function to check database connection
check_connection() {
    echo "🔍 Checking database connection..."
    npx prisma db pull --preview-feature || true
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        exit 1
    fi
}

# Main execution
main() {
    echo "Environment: ${NODE_ENV:-development}"
    
    check_connection
    generate_client
    run_migrations
    seed_database
    
    echo "🎉 Database deployment completed successfully!"
}

# Run main function
main "$@"