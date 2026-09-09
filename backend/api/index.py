import os
import sys

# Ensure root dir is in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Mark that we are running on Vercel (read by settings.py)
os.environ.setdefault('VERCEL', '1')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Ensure /tmp directories exist (Vercel ephemeral filesystem)
os.makedirs('/tmp/staticfiles', exist_ok=True)
os.makedirs('/tmp/media', exist_ok=True)

from core.wsgi import application

# Export for Vercel Serverless Function
app = application
handler = application
