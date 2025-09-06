# Database Deployment Script (PowerShell)
# This script handles database migrations and setup for production deployment

param(
    [switch]$SeedDatabase = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting database deployment..." -ForegroundColor Green

# Check if required environment variables are set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}

# Function to run database migrations
function Invoke-Migrations {
    Write-Host "📦 Running database migrations..." -ForegroundColor Yellow
    
    try {
        npx prisma migrate deploy
        Write-Host "✅ Database migrations completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Database migrations failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Function to generate Prisma client
function New-PrismaClient {
    Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
    
    try {
        npx prisma generate
        Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Prisma client generation failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Function to seed database (optional)
function Initialize-Database {
    if ($SeedDatabase -or $env:SEED_DATABASE -eq "true") {
        Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
        
        try {
            npm run db:seed
            Write-Host "✅ Database seeded successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Database seeding failed, but continuing..." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "⏭️  Skipping database seeding" -ForegroundColor Cyan
    }
}

# Function to check database connection
function Test-DatabaseConnection {
    Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
    
    try {
        npx prisma db pull --preview-feature 2>$null
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Database connection failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Main execution
try {
    Write-Host "Environment: $($env:NODE_ENV ?? 'development')" -ForegroundColor Cyan
    
    Test-DatabaseConnection
    New-PrismaClient
    Invoke-Migrations
    Initialize-Database
    
    Write-Host "🎉 Database deployment completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Database deployment failed: $_" -ForegroundColor Red
    exit 1
}