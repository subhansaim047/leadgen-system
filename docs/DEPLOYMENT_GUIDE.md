# Production Deployment Guide (Fresh VPS)

This guide walks you through deploying the **Level 2 AI Lead Generation & Outreach System** on a fresh Ubuntu 22.04 / 24.04 VPS (Hetzner, DigitalOcean, AWS EC2, etc.).

---

## 1. System Requirements

* **OS**: Ubuntu 22.04 LTS or 24.04 LTS
* **CPU**: 4 vCPUs minimum
* **RAM**: 8 GB RAM minimum (to run Playwright Chromium + Postgres + n8n smoothly)
* **Storage**: 40 GB NVMe SSD
* **Domains Required**: 
  - `app.yourdomain.com` (Frontend Dashboard)
  - `api.yourdomain.com` (FastAPI Backend)
  - `n8n.yourdomain.com` (n8n Engine)

---

## 2. Server Setup (Step-by-Step)

### Step 2.1: Update Server & Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw ca-certificates gnupg lsb-release
```

### Step 2.2: Install Docker & Docker Compose

```bash
# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## 3. Clone Repository & Configure Environment

```bash
# Navigate to your preferred deployment directory
cd /opt
git clone <YOUR_REPOSITORY_URL> leadgen-system
cd leadgen-system

# Create .env from template
cp .env.example .env

# Edit .env file with your production keys
nano .env
```

Make sure to set strong passwords for:
- `POSTGRES_PASSWORD`
- `API_SECRET_TOKEN`
- `NEXTAUTH_SECRET`
- `N8N_BASIC_AUTH_PASSWORD`
- `OPENAI_API_KEY`
- `OUTSCRAPER_API_KEY`

---

## 4. Launch Services with Docker Compose

```bash
# Build and start all 6 containers in background mode
docker compose up -d --build

# Check status of running containers
docker compose ps
```

---

## 5. SSL Certificates Setup (Let's Encrypt)

Run Certbot to obtain free SSL certificates for your 3 domains:

```bash
docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
  -d app.yourdomain.com \
  -d api.yourdomain.com \
  -d n8n.yourdomain.com \
  --email your-email@example.com --agree-tos --no-eff-email
```

After certificates are generated, reload Nginx:

```bash
docker compose exec nginx nginx -s reload
```

---

## 6. Import n8n Workflows

1. Open `https://n8n.yourdomain.com` in your browser.
2. Log in with your `N8N_BASIC_AUTH_USER` and `N8N_BASIC_AUTH_PASSWORD`.
3. Go to **Workflows -> Import from File**.
4. Upload `n8n/01_daily_lead_discovery.json` and `n8n/02_audit_and_ai_enrichment.json`.
5. Toggle the workflows to **Active**.

---

## 7. Maintenance & Commands

* **View Logs**: `docker compose logs -f api`
* **Restart System**: `docker compose restart`
* **Backup Database**:
  ```bash
  docker compose exec db pg_dump -U leadgen_admin leadgen > backup_$(date +%F).sql
  ```
