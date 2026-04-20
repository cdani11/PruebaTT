# ── Base: PHP 8.3 + Apache en Debian Bookworm (12) ───────────────────────────
# phpsqlsrv/pdo_sqlsrv >= 5.12 requieren PHP 8.3+; bookworm fijado para compatibilidad con ODBC driver
FROM php:8.3-apache-bookworm

# ── Driver ODBC de Microsoft + extensiones sqlsrv / pdo_sqlsrv ───────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https curl gnupg2 unzip \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
       | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64,armhf,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] \
       https://packages.microsoft.com/debian/12/prod bookworm main" \
       > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 unixodbc-dev \
    && pecl install sqlsrv pdo_sqlsrv \
    && docker-php-ext-enable sqlsrv pdo_sqlsrv \
    && rm -rf /var/lib/apt/lists/*

# ── Composer ──────────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ── Dependencias (capa cacheada; solo se repite si cambia composer.json) ──────
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-autoloader --no-interaction

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY . .

# Generar autoloader optimizado con el código ya presente
RUN composer dump-autoload --optimize

# ── Apache: habilitar mod_rewrite y aplicar VirtualHost ──────────────────────
RUN a2enmod rewrite
COPY .docker/apache.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80
