from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyJobViewSet, JobApplicationViewSet

router = DefaultRouter()
router.register(r'jobs', DailyJobViewSet, basename='daily-job')
router.register(r'applications', JobApplicationViewSet, basename='job-application')

urlpatterns = [
    path('', include(router.urls)),
]
