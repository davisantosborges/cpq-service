#!/bin/bash

# CPQ Service Test Runner
# This script demonstrates different ways to run tests

echo "🧪 CPQ Service Test Suite"
echo "=========================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Function to run a test command
run_test() {
  echo "▶️  $1"
  echo "---"
  eval "$2"
  echo ""
}

# Menu
echo "Select test mode:"
echo "1) Run all tests (watch mode)"
echo "2) Run all tests once"
echo "3) Run tests with coverage"
echo "4) Run specific test categories"
echo "5) Run integration tests only"
echo "6) Exit"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
  1)
    echo ""
    run_test "Running all tests in watch mode" "npm test"
    ;;
  2)
    echo ""
    run_test "Running all tests once" "npm run test:run"
    ;;
  3)
    echo ""
    run_test "Running tests with coverage" "npm run test:coverage"
    echo "📊 Coverage report generated in coverage/index.html"
    echo "   Open it in a browser to see detailed coverage"
    ;;
  4)
    echo ""
    echo "Select category:"
    echo "a) Configuration tests"
    echo "b) Pricing tests"
    echo "c) Service tests"
    echo "d) API route tests"
    echo ""
    read -p "Enter choice [a-d]: " category

    case $category in
      a)
        run_test "Running configuration tests" "npx vitest src/config/configuration-rules.test.ts"
        ;;
      b)
        run_test "Running pricing tests" "npx vitest src/config/pricing-rules.test.ts"
        ;;
      c)
        run_test "Running service tests" "npx vitest src/services"
        ;;
      d)
        run_test "Running API route tests" "npx vitest src/routes"
        ;;
    esac
    ;;
  5)
    echo ""
    run_test "Running integration tests" "npx vitest src/tests/integration.test.ts"
    ;;
  6)
    echo "👋 Goodbye!"
    exit 0
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
