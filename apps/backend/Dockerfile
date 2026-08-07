FROM python:3.12-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget curl gnupg \
    libglib2.0-0 libnss3 libgconf-2-4 libfontconfig1 \
    libxss1 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxfixes3 libxi6 libxrandr2 libxrender1 libxtst6 \
    libasound2 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 \
    libgbm1 libxkbcommon0 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy application code
COPY . .

# Create screenshots directory
RUN mkdir -p /app/screenshots

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
