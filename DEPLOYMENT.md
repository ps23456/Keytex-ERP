# VPS Deployment Guide for Keytex ERP Frontend

This guide will walk you through deploying your React application on a VPS server using Nginx as a reverse proxy.

## Prerequisites

- A VPS server (Ubuntu 20.04/22.04 recommended)
- Root or sudo access to the server
- Domain name pointing to your VPS IP (optional but recommended)
- SSH access to your server

## Step 1: Initial Server Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-server-ip
# Or if using a user account:
ssh username@your-server-ip
```

### 1.2 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Create a Non-Root User (Recommended)

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
su - deploy
```

## Step 2: Install Required Software

### 2.1 Install Node.js and npm

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.2 Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 2.3 Install Git (if not already installed)

```bash
sudo apt install -y git
```

### 2.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 3: Prepare Your Application

### 3.1 Build the Application Locally (Recommended)

On your local machine:

```bash
# Navigate to project directory
cd /path/to/keytex

# Install dependencies
npm install

# Build for production
npm run build
```

This will create a `dist` folder with your production-ready files.

### 3.2 Alternative: Build on Server

If you prefer to build on the server:

```bash
# On your VPS server
cd ~
git clone https://github.com/your-username/keytex.git
# Or upload files via SCP/FTP

cd keytex
npm install
npm run build
```

## Step 4: Transfer Files to Server

### Option A: Using SCP (Secure Copy)

From your local machine:

```bash
# Transfer the dist folder
scp -r dist/ deploy@your-server-ip:/var/www/keytex

# Or transfer entire project and build on server
scp -r . deploy@your-server-ip:~/keytex
```

### Option B: Using Git

```bash
# On server
cd /var/www
sudo git clone https://github.com/your-username/keytex.git
cd keytex
npm install
npm run build
```

### Option C: Using rsync

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' ./ deploy@your-server-ip:~/keytex
```

## Step 5: Set Up Application Directory

```bash
# Create web directory
sudo mkdir -p /var/www/keytex
sudo chown -R $USER:$USER /var/www/keytex

# If you built locally, move dist contents
# If built on server:
sudo cp -r ~/keytex/dist/* /var/www/keytex/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/keytex
sudo chmod -R 755 /var/www/keytex
```

## Step 6: Configure Nginx

### 6.1 Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/keytex
```

Add the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    # Replace with your domain or use server IP

    root /var/www/keytex;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

**If using IP address instead of domain:**

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/keytex;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/keytex /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 7: Set Up SSL with Let's Encrypt (Recommended)

### 7.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtain SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### 7.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
sudo certbot renew --dry-run
```

## Step 8: Configure Firewall

### 8.1 Set Up UFW (Uncomplicated Firewall)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 9: Environment Variables (If Needed)

If your app needs environment variables:

```bash
# Create environment file (if using API proxy)
sudo nano /var/www/keytex/.env.production
```

Add your environment variables:

```env
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME=Keytex ERP
```

**Note:** In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser.

## Step 10: Set Up Auto-Deployment Script (Optional)

Create a deployment script for easy updates:

```bash
nano ~/deploy-keytex.sh
```

Add:

```bash
#!/bin/bash
cd ~/keytex
git pull origin main
npm install
npm run build
sudo cp -r dist/* /var/www/keytex/
sudo systemctl reload nginx
echo "Deployment completed!"
```

Make it executable:

```bash
chmod +x ~/deploy-keytex.sh
```

## Step 11: Monitoring and Maintenance

### 11.1 Check Application Logs

```bash
# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### 11.2 Monitor Server Resources

```bash
# CPU and memory usage
htop
# Or
top
```

## Step 12: Troubleshooting

### Common Issues:

**1. 502 Bad Gateway**
- Check if Nginx is running: `sudo systemctl status nginx`
- Check file permissions: `sudo chown -R www-data:www-data /var/www/keytex`

**2. 404 Not Found**
- Verify file path: `ls -la /var/www/keytex`
- Check Nginx configuration: `sudo nginx -t`

**3. Static assets not loading**
- Clear browser cache
- Check file permissions
- Verify Nginx configuration has proper `try_files` directive

**4. CORS Issues**
- Ensure your backend API allows requests from your domain
- Check Nginx proxy settings if using API proxy

## Step 13: Performance Optimization

### 13.1 Enable Nginx Caching

Edit your Nginx config:

```nginx
# Add to your server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    try_files $uri $uri/ /index.html;
}
```

### 13.2 Enable Compression

Already included in the config above, but you can fine-tune:

```nginx
gzip_comp_level 6;
gzip_proxied any;
```

## Quick Deployment Checklist

- [ ] Server updated and secured
- [ ] Node.js and Nginx installed
- [ ] Application built successfully
- [ ] Files transferred to `/var/www/keytex`
- [ ] Nginx configuration created and tested
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Domain DNS pointing to server IP
- [ ] Application accessible via browser
- [ ] Monitoring set up

## Useful Commands Reference

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx

# View Nginx configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Renew SSL certificate
sudo certbot renew

# Check disk space
df -h

# Check memory usage
free -h
```

## Support

For issues specific to:
- **Vite**: Check [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- **Nginx**: Check [Nginx Documentation](https://nginx.org/en/docs/)
- **Let's Encrypt**: Check [Certbot Documentation](https://certbot.eff.org/docs/)

---

**Note:** This guide assumes a standard deployment. Adjust according to your specific requirements and server configuration.

