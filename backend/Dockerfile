FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Backup initial media files to seed persistent volume if mounted
RUN mkdir -p /app/default_media && cp -r /app/media/* /app/default_media/ 2>/dev/null || true

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port (Railway dynamically injects PORT)
EXPOSE 8000

CMD mkdir -p /app/media && cp -rn /app/default_media/* /app/media/ 2>/dev/null || true; chmod -R 777 /app/media 2>/dev/null || true; python manage.py migrate --noinput && python load_initial_data.py && exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4 --timeout 120



