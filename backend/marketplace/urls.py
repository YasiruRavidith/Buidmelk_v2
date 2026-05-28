from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.MaterialCategoryViewSet)
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'materials', views.MaterialViewSet)
router.register(r'brands', views.BrandViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('reviews/', views.reviews, name='reviews'),
    path('cart/', views.cart, name='cart'),
    path('cart/update/', views.cart_update, name='cart_update'),
    path('cart/remove/', views.cart_remove, name='cart_remove'),
]