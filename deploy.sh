#!/bin/bash

# Keytex ERP Frontend Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on error

ENVIRONMENT=${1:-production}
DOMAIN=${2:-""}

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please don't run as root. Use a sudo user instead.${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 2: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! dist folder not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Step 3: Create deployment directory
echo -e "${YELLOW}📁 Setting up deployment directory...${NC}"
sudo mkdir -p /var/www/keytex
sudo chown -R $USER:$USER /var/www/keytex

# Step 4: Copy files
echo -e "${YELLOW}📋 Copying files to deployment directory...${NC}"
cp -r dist/* /var/www/keytex/

# Step 5: Set permissions
echo -e "${YELLOW}🔒 Setting permissions...${NC}"
sudo chown -R www-data:www-data /var/www/keytex
sudo chmod -R 755 /var/www/keytex

# Step 6: Test Nginx configuration
echo -e "${YELLOW}🔍 Testing Nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

# Step 7: Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application should now be live!${NC}"

if [ -n "$DOMAIN" ]; then
    echo -e "${GREEN}📍 Check it out at: http://$DOMAIN${NC}"
else
    echo -e "${YELLOW}📍 Don't forget to configure your domain in Nginx!${NC}"
fi
















