# SSL Automation Setup for lookquran.com

## Environment
- **Domain registrar**: Namecheap
- **SSL**: Let’s Encrypt via **acme.sh** with Namecheap DNS API  
- **App**: Docker / docker-compose  

---

## One-time Setup

### 1. Enable Namecheap API
- Enable API in Namecheap account.  
- Whitelist server’s public IPv4.  
- Get API key + username.  

### 2. Install acme.sh (root)
```bash
sudo su -
curl https://get.acme.sh | sh
~/.acme.sh/acme.sh --upgrade --auto-upgrade
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
```

### 3. Issue certificate (wildcard + apex)
```bash
export NAMECHEAP_USERNAME="NAMECHEAP_USERNAME"
export NAMECHEAP_API_KEY="API_KEY"

~/.acme.sh/acme.sh --issue \
  -d lookquran.com -d '*.lookquran.com' \
  --dns dns_namecheap \
  --keylength ec-256 \
  --dnssleep 120
```

### 4. Install cert to live path
```bash
mkdir -p /etc/letsencrypt/live/lookquran.com

~/.acme.sh/acme.sh --install-cert -d lookquran.com --ecc \
  --key-file       /etc/letsencrypt/live/lookquran.com/privkey.pem \
  --fullchain-file /etc/letsencrypt/live/lookquran.com/fullchain.pem \
  --reloadcmd      "/etc/letsencrypt/renewal-hooks/deploy/reload-docker.sh"

chmod 600 /etc/letsencrypt/live/lookquran.com/privkey.pem
chmod 644 /etc/letsencrypt/live/lookquran.com/fullchain.pem
```

### 5. Hook: restart containers on renewal
```bash
mkdir -p /etc/letsencrypt/renewal-hooks/deploy

cat >/etc/letsencrypt/renewal-hooks/deploy/reload-docker.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
COMPOSE_FILE="/path/to/docker-compose.prod.yml"   # <-- adjust path
docker-compose -f "$COMPOSE_FILE" restart
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-docker.sh
```

---

## Automation

- acme.sh added a **root cron job**:
  ```
  22 14 * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
  ```
- This runs daily at 14:22 UTC.  
- If renewal is due, acme.sh:
  1. Updates TXT records via Namecheap API.  
  2. Renews cert with Let’s Encrypt.  
  3. Saves to `/etc/letsencrypt/live/lookquran.com/`.  
  4. Executes `docker-compose restart` hook.  

---

## Verification

### Check cron
```bash
sudo crontab -l
```

### Force renewal (include apex + wildcard)
```bash
sudo /root/.acme.sh/acme.sh --renew -d lookquran.com -d '*.lookquran.com' --ecc --force
```

### Confirm expiry date
```bash
openssl x509 -in /etc/letsencrypt/live/lookquran.com/fullchain.pem -noout -enddate
```

### Check domains covered by the cert
```bash
openssl x509 -in /etc/letsencrypt/live/lookquran.com/fullchain.pem -noout -text | grep DNS:
```

---

✅ With this setup, certificates renew automatically and containers are restarted with `docker-compose restart` whenever a new cert is issued.  
