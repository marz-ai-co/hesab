# مرز حساب (Marz Studio Ledger)

اپلیکیشن حسابداری شخصی فارسی (RTL) با دیتابیس چند دستگاهی و قابلیت نصب روی موبایل (PWA).
طراحی و توسعه: **Marz**

## ۱. پوش کردن روی GitHub / GitLab
این پوشه از قبل با `git init` و کامیت اولیه آماده شده است:

```bash
git remote add origin https://github.com/YOUR_USERNAME/marz-hesab.git
git push -u origin main
```

## ۲. نصب روی سرور VPS با Git
```bash
ssh root@YOUR_VPS_IP
git clone https://github.com/YOUR_USERNAME/marz-hesab.git /var/www/marz-hesab
cd /var/www/marz-hesab
sudo bash deploy_vps.sh hesab.yourdomain.com
sudo certbot --nginx -d hesab.yourdomain.com
```
