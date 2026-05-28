from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectPostViewSet)
router.register(r'bids', views.BidViewSet)

urlpatterns = [
    path('', include(router.urls)),
]