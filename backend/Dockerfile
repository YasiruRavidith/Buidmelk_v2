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

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port (7860 is default for Hugging Face Spaces, Render overrides with $PORT)
EXPOSE 7860

CMD exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-7860} --workers 2 --threads 4 --timeout 120
