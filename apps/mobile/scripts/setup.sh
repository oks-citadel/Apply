#!/bin/bash

# JobPilot Mobile App Setup Script
# This script automates the initial setup process

set -e

echo "=========================================="
echo "JobPilot Mobile App - Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the apps/mobile directory${NC}"
    exit 1
fi

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher is required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version is compatible${NC}"

# Install npm dependencies
echo ""
echo "Installing npm dependencies..."
npm install
echo -e "${GREEN}✓ npm dependencies installed${NC}"

# Setup environment file
echo ""
echo "Setting up environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ .env file created. Please update with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# iOS setup (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "Detected macOS. Setting up iOS dependencies..."

    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo -e "${YELLOW}⚠ CocoaPods not found. Installing...${NC}"
        sudo gem install cocoapods
    fi

    # Install pods
    echo "Installing iOS dependencies (this may take a few minutes)..."
    cd ios
    pod install
    cd ..
    echo -e "${GREEN}✓ iOS dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Skipping iOS setup (not on macOS)${NC}"
fi

# Setup complete
echo ""
echo "=========================================="
echo -e "${GREEN}Setup completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update the .env file with your API URL and OAuth credentials"
echo "2. Start the Metro bundler: npm start"
echo "3. Run the app:"
echo "   - iOS: npm run ios"
echo "   - Android: npm run android"
echo ""
echo "For more information, see SETUP.md"
echo ""
