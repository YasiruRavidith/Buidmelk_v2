import os
import sys

# Ensure root dir is in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from core.wsgi import application

# Export for Vercel Serverless Function
app = application
handler = application

