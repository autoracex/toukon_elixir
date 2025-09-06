#!/bin/bash

# 闘魂Elixir Landing Page - Integration Test Runner
# This script runs the complete integration test suite

set -e  # Exit on any error

echo "🔥 闘魂Elixir Landing Page - Integration Test Suite"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status $RED "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status $GREEN "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_status $RED "❌ npm is not installed. Please install npm first."
    exit 1
fi

print_status $GREEN "✅ npm found: $(npm --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "📦 Installing dependencies..."
    npm install
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_status $RED "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Create output directories
mkdir -p lighthouse-reports
mkdir -p browser-test-reports  
mkdir -p deployment-test-reports
mkdir -p integration-test-reports

print_status $BLUE "📁 Test output directories created"

# Check if local server is needed
LOCAL_TESTS=true
DEPLOYMENT_TESTS=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local-only)
            DEPLOYMENT_TESTS=false
            shift
            ;;
        --deployment-only)
            LOCAL_TESTS=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --local-only      Run only local tests (Lighthouse + Browser)"
            echo "  --deployment-only Run only deployment tests"
            echo "  --help           Show this help message"
            echo ""
            exit 0
            ;;
        *)
            print_status $RED "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to check if server is running
check_server() {
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
        return 0
    else
        return 1
    fi
}

# Function to start local server
start_server() {
    print_status $YELLOW "🚀 Starting local development server..."
    
    # Kill any existing server on port 8000
    if lsof -ti:8000 >/dev/null 2>&1; then
        print_status $YELLOW "⚠️  Killing existing server on port 8000..."
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Start server in background
    npm run serve > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start
    print_status $YELLOW "⏳ Waiting for server to start..."
    for i in {1..10}; do
        if check_server; then
            print_status $GREEN "✅ Local server started successfully (PID: $SERVER_PID)"
            return 0
        fi
        sleep 1
    done
    
    print_status $RED "❌ Failed to start local server"
    return 1
}

# Function to stop local server
stop_server() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status $YELLOW "🛑 Stopping local server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    
    # Clean up any remaining processes on port 8000
    if lsof -ti:8000 >/dev/null 2>&1; then
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fi
}

# Trap to ensure server is stopped on exit
trap stop_server EXIT

# Main test execution
OVERALL_SUCCESS=true

if [ "$LOCAL_TESTS" = true ]; then
    # Start local server for local tests
    if start_server; then
        echo ""
        print_status $BLUE "🧪 Running Local Tests..."
        echo "========================"
        
        # Run Lighthouse test
        print_status $YELLOW "1️⃣  Running Lighthouse Performance Audit..."
        if node lighthouse-test.js; then
            print_status $GREEN "✅ Lighthouse test passed"
        else
            print_status $RED "❌ Lighthouse test failed"
            OVERALL_SUCCESS=false
        fi
        
        echo ""
        
        # Run Browser tests
        print_status $YELLOW "2️⃣  Running Cross-Browser Compatibility Tests..."
        if node browser-test.js; then
            print_status $GREEN "✅ Browser tests passed"
        else
            print_status $RED "❌ Browser tests failed"
            OVERALL_SUCCESS=false
        fi
        
    else
        print_status $RED "❌ Cannot run local tests - server failed to start"
        OVERALL_SUCCESS=false
    fi
fi

if [ "$DEPLOYMENT_TESTS" = true ]; then
    echo ""
    print_status $BLUE "🌐 Running Deployment Tests..."
    echo "============================="
    
    # Run Deployment tests
    print_status $YELLOW "3️⃣  Running GitHub Pages Deployment Verification..."
    if node deployment-test.js; then
        print_status $GREEN "✅ Deployment tests passed"
    else
        print_status $RED "❌ Deployment tests failed"
        OVERALL_SUCCESS=false
    fi
fi

# Generate final report
echo ""
print_status $BLUE "📊 Generating Final Report..."
echo "============================"

if node integration-test.js; then
    print_status $GREEN "✅ Integration test report generated"
else
    print_status $RED "❌ Failed to generate integration test report"
    OVERALL_SUCCESS=false
fi

# Final summary
echo ""
print_status $BLUE "🎯 Test Suite Summary"
echo "===================="

if [ "$OVERALL_SUCCESS" = true ]; then
    print_status $GREEN "🎉 All tests passed successfully!"
    echo ""
    print_status $GREEN "📄 Reports generated in:"
    echo "   • lighthouse-reports/"
    echo "   • browser-test-reports/"
    echo "   • deployment-test-reports/"
    echo "   • integration-test-reports/"
    echo ""
    exit 0
else
    print_status $RED "⚠️  Some tests failed. Please check the detailed output above."
    echo ""
    print_status $YELLOW "💡 Troubleshooting tips:"
    echo "   • Check server logs: cat server.log"
    echo "   • Verify dependencies: npm install"
    echo "   • Check network connectivity for deployment tests"
    echo "   • Review test reports for detailed error information"
    echo ""
    exit 1
fi