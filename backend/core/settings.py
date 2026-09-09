import os
import json
from pathlib import Path
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
load_dotenv() # Fallback for root env

# Safe Firebase Admin initialization (supports JSON string env var or key file)
if not firebase_admin._apps:
    firebase_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
    cred_path = os.path.join(BASE_DIR, os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-key.json'))
    
    try:
        if firebase_json:
            cred_dict = json.loads(firebase_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        elif os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to default app initialization if no key provided yet
            firebase_admin.initialize_app()
    except Exception as e:
        print(f"Warning: Firebase Admin initialization note: {e}")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-buildmelk-production-secret-key-change-in-prod')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

def env_or_default(name, default):
    value = os.getenv(name)
    return value if value else default


OPENROUTER_API_KEY = env_or_default('OPENROUTER_API_KEY', '')
OPENROUTER_MODEL = env_or_default('OPENROUTER_MODEL', 'openai/gpt-4o-mini')
OPENROUTER_SITE_URL = env_or_default('OPENROUTER_SITE_URL', 'https://buildmelk-backend.vercel.app')
OPENROUTER_APP_NAME = env_or_default('OPENROUTER_APP_NAME', 'BuildMe.lk')
OPENROUTER_REFRESH_INTERVAL_HOURS = int(env_or_default('OPENROUTER_REFRESH_INTERVAL_HOURS', '24'))

allowed_hosts_env = os.getenv('ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()] if allowed_hosts_env != '*' else ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
    'estimations',
    'bidding',
    'marketplace',
    'ai_chatbot',
    'workers',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTH_USER_MODEL = 'users.CustomUser'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

try:
    import dj_database_url
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL:
        DATABASES = {
            'default': dj_database_url.config(
                default=DATABASE_URL,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    else:
        db_path = '/tmp/db.sqlite3' if os.getenv('VERCEL') else BASE_DIR / 'db.sqlite3'
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': db_path,
            }
        }
except ImportError:
    db_path = '/tmp/db.sqlite3' if os.getenv('VERCEL') else BASE_DIR / 'db.sqlite3'
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': db_path,
        }
    }


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = '/tmp/staticfiles' if os.getenv('VERCEL') else BASE_DIR / 'staticfiles'

# Media files (user uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = '/tmp/media' if os.getenv('VERCEL') else BASE_DIR / 'media'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'users.authentication.FirebaseAuthentication',
    ],
}
