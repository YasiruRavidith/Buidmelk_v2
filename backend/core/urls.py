"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import traceback
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """Diagnostic endpoint to test DB connectivity and app health."""
    result = {"status": "ok", "debug": settings.DEBUG, "db": None, "error": None}
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        result["db"] = "connected"
    except Exception as e:
        result["db"] = "error"
        result["error"] = traceback.format_exc()
        result["status"] = "error"
    return JsonResponse(result)


urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/estimations/', include('estimations.urls')),
    path('api/bidding/', include('bidding.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/workers/', include('workers.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
