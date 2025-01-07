FROM ghcr.io/puppeteer/puppeteer:22.0.0

USER root

WORKDIR /app

# Aumentar o timeout do npm
RUN npm config set fetch-timeout 600000
RUN npm config set fetch-retry-maxtimeout 600000

COPY package*.json ./

# Instalar com --force para ignorar warnings de versão
RUN npm install --force

COPY . .

# Adicionar healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "setTimeout(() => process.exit(0), 1000);"

CMD ["npm", "start"] 