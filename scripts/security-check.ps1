# Security Check Script for Mobile Matrix (PowerShell)
# Run this before committing to ensure no sensitive data is included

Write-Host "Running security checks for Mobile Matrix..." -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$sensitiveFound = $false

# Function to print colored output
function Write-Status {
    param(
        [string]$Color,
        [string]$Message
    )
    
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        default { Write-Host $Message }
    }
}

# Check for .env files
Write-Host ""
Write-Host "Checking for environment files..."
if ((Test-Path ".env") -or (Test-Path ".env.local")) {
    Write-Status "Red" "ERROR: Found .env or .env.local file - these should not be committed!"
    Write-Host "   Please remove these files and add sensitive data to .env.example as placeholders"
    exit 1
} else {
    Write-Status "Green" "OK: No .env files found"
}

# Check for common sensitive patterns
Write-Host ""
Write-Host "Scanning for sensitive patterns..."

# Simple check for potential API keys
try {
    $files = Get-ChildItem -Recurse -File -Include "*.js", "*.ts", "*.json", "*.md", "*.yml", "*.yaml" | 
        Where-Object { $_.Directory.Name -notmatch "node_modules|\.git|dist|build|coverage|\.next" }
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            # Check for patterns that look like real API keys (not test/example ones)
            if ($content -match "sk-[a-zA-Z0-9]{48}" -or 
                $content -match "AIza[a-zA-Z0-9]{35}" -or
                $content -match "ghp_[a-zA-Z0-9]{36}") {
                
                # Exclude test and example files
                if ($file.Name -notmatch "test|example|mock" -and $content -notmatch "test|example|mock|placeholder") {
                    Write-Status "Red" "ERROR: Found potential real API key in: $($file.Name)"
                    $script:sensitiveFound = $true
                }
            }
        }
    }
} catch {
    Write-Host "Warning: Could not scan all files for sensitive patterns"
}

if (-not $sensitiveFound) {
    Write-Status "Green" "OK: No sensitive patterns detected"
}

# Check .gitignore exists and has essential entries
Write-Host ""
Write-Host "Checking .gitignore..."
if (-not (Test-Path ".gitignore")) {
    Write-Status "Red" "ERROR: .gitignore file missing!"
    exit 1
}

$essentialIgnores = @(".env", "node_modules", "*.log", "dist", "build")
$gitignoreContent = Get-Content ".gitignore" -Raw -ErrorAction SilentlyContinue
$missingIgnores = @()

foreach ($ignore in $essentialIgnores) {
    if ($gitignoreContent -and $gitignoreContent -notmatch [regex]::Escape($ignore)) {
        $missingIgnores += $ignore
    }
}

if ($missingIgnores.Count -gt 0) {
    $missingList = $missingIgnores -join ", "
    Write-Status "Yellow" "WARNING: Missing essential .gitignore entries: $missingList"
} else {
    Write-Status "Green" "OK: .gitignore has essential entries"
}

# Check for example files
Write-Host ""
Write-Host "Checking for example files..."
if (Test-Path ".env.example") {
    Write-Status "Green" "OK: .env.example file exists"
} else {
    Write-Status "Yellow" "WARNING: .env.example file missing - consider adding one"
}

# Check documentation files
Write-Host ""
Write-Host "Checking documentation..."
$docFiles = @("README.md", "LICENSE")
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Write-Status "Green" "OK: $doc exists"
    } else {
        Write-Status "Yellow" "WARNING: $doc missing"
    }
}

# Final summary
Write-Host ""
Write-Host "Security Check Summary"
if ($sensitiveFound) {
    Write-Status "Red" "SECURITY ISSUES FOUND - Please fix before committing!"
    exit 1
} else {
    Write-Status "Green" "Security check passed - Ready for open source!"
}

Write-Host ""
Write-Host "Security check completed successfully!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps for open source:"
Write-Host "   1. Review any warnings above"
Write-Host "   2. Update README.md with your GitHub username"
Write-Host "   3. Update package.json with your repository URL"
Write-Host "   4. Create GitHub repository"
Write-Host "   5. Push code: git push origin main"

Write-Host ""
Write-Host "Useful commands:"
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/mobile-matrix.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"

Write-Host ""
Write-Host "Suggested GitHub topics:"
Write-Host "   ai, phone-comparison, nextjs, typescript, google-ai, mobile, react"