#!/usr/bin/env bash
set -e

DOMAIN=${1:-"hesab.example.com"}
APP_DIR="/var/www/marz-hesab"

apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

mkdir -p "${APP_DIR}"
cp -r ./* "${APP_DIR}/" 2>/dev/null || true
chown -R www-data:www-data "${APP_DIR}"

cat << 'SERVICE' > /etc/systemd/system/marz-hesab.service
[Unit]
Description=Marz Studio Personal Accounting Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/marz-hesab
ExecStart=/usr/bin/node /var/www/marz-hesab/server.js
Restart=always
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now marz-hesab

cat << NGINX > /etc/nginx/sites-available/marz-hesab
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/marz-hesab /etc/nginx/sites-enabled/marz-hesab
nginx -t && systemctl reload nginx
echo "Ready! Run: sudo certbot --nginx -d ${DOMAIN}"
