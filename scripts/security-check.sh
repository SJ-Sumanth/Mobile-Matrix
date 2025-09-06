#!/bin/bash

# Security Check Script for Mobile Matrix
# Run this before committing to ensure no sensitive data is included

set -e

echo "🔒 Running security checks for Mobile Matrix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check for .env files
echo "\n📁 Checking for environment files..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    print_status $RED "❌ Found .env or .env.local file - these should not be committed!"
    echo "   Please remove these files and add sensitive data to .env.example as placeholders"
    exit 1
else
    print_status $GREEN "✅ No .env files found"
fi

# Check for common sensitive patterns
echo "\n🔍 Scanning for sensitive patterns..."

# Patterns to search for (excluding test files and examples)
sensitive_found=false

# Check for real API keys (not test or example ones)
if grep -r -i -E "(api[_-]?key|secret|password|token)\s*[:=]\s*[\"'][^\"']{20,}" . \
    --exclude-dir={node_modules,.git,dist,build,coverage,.next} \
    --exclude="*.log" \
    | grep -v -E "(test|example|placeholder|your_|REPLACE_|mock)" 2>/dev/null; then
    print_status $RED "❌ Found potential real API keys or secrets!"
    sensitive_found=true
fi

# Check for hardcoded production URLs (except known safe ones)
if grep -r -E "https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" . \
    --exclude-dir={node_modules,.git,dist,build,coverage,.next} \
    --exclude="*.log" \
    | grep -v -E "(localhost|127\.0\.0\.1|example\.com|your-domain\.com|\.test|aistudio\.google|ai\.google|storybook\.js|npmjs\.org|github\.com|opensource\.org)" \
    | grep -v -E "(componentdriven\.org|prisma\.io|nextjs\.org|typescriptlang\.org)" 2>/dev/null; then
    print_status $YELLOW "⚠️  Found some external URLs - please review if they contain sensitive information"
fi

if [ "$sensitive_found" = false ]; then
    print_status $GREEN "✅ No sensitive patterns detected"
fi

# Check .gitignore exists and has essential entries
echo "\n📋 Checking .gitignore..."
if [ ! -f ".gitignore" ]; then
    print_status $RED "❌ .gitignore file missing!"
    exit 1
fi

essential_ignores=(".env" "node_modules" "*.log" "dist" "build")
missing_ignores=()

for ignore in "${essential_ignores[@]}"; do
    if ! grep -q "$ignore" .gitignore; then
        missing_ignores+=("$ignore")
    fi
done

if [ ${#missing_ignores[@]} -gt 0 ]; then
    print_status $YELLOW "⚠️  Missing essential .gitignore entries: ${missing_ignores[*]}"
else
    print_status $GREEN "✅ .gitignore has essential entries"
fi

# Check for example files
echo "\n📄 Checking for example files..."
if [ -f ".env.example" ]; then
    print_status $GREEN "✅ .env.example file exists"
else
    print_status $YELLOW "⚠️  .env.example file missing - consider adding one"
fi

# Check documentation files
echo "\n📚 Checking documentation..."
doc_files=("README.md" "LICENSE")
for doc in "${doc_files[@]}"; do
    if [ -f "$doc" ]; then
        print_status $GREEN "✅ $doc exists"
    else
        print_status $YELLOW "⚠️  $doc missing"
    fi
done

# Final summary
echo "\n📊 Security Check Summary"
if [ "$sensitive_found" = true ]; then
    print_status $RED "❌ SECURITY ISSUES FOUND - Please fix before committing!"
    exit 1
else
    print_status $GREEN "✅ Security check passed - Ready for open source!"
fi

echo "\n🎉 Security check completed successfully!"
echo "\n📋 Next steps for open source:"
echo "   1. Review any warnings above"
echo "   2. Update README.md with your GitHub username"
echo "   3. Update package.json with your repository URL"
echo "   4. Create GitHub repository"
echo "   5. Push code: git push origin main"

echo "\n🔗 Useful commands:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/mobile-matrix.git"
echo "   git branch -M main"
echo "   git push -u origin main"

echo "\n🏷️  Suggested GitHub topics:"
echo "   ai, phone-comparison, nextjs, typescript, google-ai, mobile, react"