"""
URL configuration for core project.
"""
import os
import traceback
import sys
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.http import JsonResponse


def health_check(request):
    """Diagnostic endpoint - returns exact error info from DB + app state."""
    result = {
        "status": "ok",
        "python": sys.version,
        "django_debug": settings.DEBUG,
        "on_vercel": bool(os.getenv('VERCEL') or os.getenv('VERCEL_ENV')),
        "db_engine": None,
        "db": None,
        "error": None,
        "installed_apps": list(settings.INSTALLED_APPS),
    }

    try:
        result["db_engine"] = settings.DATABASES.get("default", {}).get("ENGINE", "unknown")
    except Exception:
        pass

    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        result["db"] = "connected"
    except Exception:
        result["db"] = "ERROR"
        result["error"] = traceback.format_exc()
        result["status"] = "db_error"

    if result["db"] == "connected":
        try:
            from bidding.models import ProjectPost
            count = ProjectPost.objects.count()
            result["projects_count"] = count
        except Exception:
            result["projects_error"] = traceback.format_exc()
            result["status"] = "query_error"

    return JsonResponse(result, json_dumps_params={"indent": 2})


urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/estimations/', include('estimations.urls')),
    path('api/bidding/', include('bidding.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/workers/', include('workers.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
