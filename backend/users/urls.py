from django.urls import path
from . import views

urlpatterns = [
    path('auth/verify/', views.verify_firebase_token, name='verify_firebase_token'),
    path('profile/', views.get_user_profile, name='get_user_profile'),
    path('onboarding/', views.update_onboarding, name='update_onboarding'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/image/', views.upload_profile_image, name='upload_profile_image'),
    path('locations/', views.get_locations, name='get_locations'),
    path('profile/assets/', views.upload_professional_asset, name='upload_professional_asset'),
    path('shops/', views.list_public_hardware_shops, name='list_public_hardware_shops'),
    path('shops/<int:shop_id>/', views.get_public_hardware_shop, name='get_public_hardware_shop'),
    path('hardware/shops/list/', views.list_hardware_shops, name='list_hardware_shops'),
    path('hardware/shops/create/', views.create_hardware_shop, name='create_hardware_shop'),
    path('hardware/shops/<int:shop_id>/update/', views.update_hardware_shop, name='update_hardware_shop'),
    path('hardware/shops/<int:shop_id>/delete/', views.delete_hardware_shop, name='delete_hardware_shop'),
    path('hardware/shops/<int:shop_id>/images/', views.upload_hardware_shop_images, name='upload_hardware_shop_images'),
    path('hardware/shops/<int:shop_id>/items/list/', views.list_hardware_shop_items, name='list_hardware_shop_items'),
    path('hardware/shops/<int:shop_id>/items/add/', views.add_hardware_shop_item, name='add_hardware_shop_item'),
    path('hardware/shops/items/<int:item_id>/update/', views.update_hardware_shop_item, name='update_hardware_shop_item'),
    path('hardware/shops/items/<int:item_id>/delete/', views.delete_hardware_shop_item, name='delete_hardware_shop_item'),
    path('professionals/', views.list_professionals, name='list_professionals'),
    path('professionals/<int:prof_id>/', views.get_professional, name='get_professional'),
]
