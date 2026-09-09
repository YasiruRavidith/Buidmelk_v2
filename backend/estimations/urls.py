from django.urls import path
from . import views

urlpatterns = [
    path('calculate/', views.calculate_estimation, name='calculate_estimation'),
    path('history/', views.get_user_estimations, name='estimation_history'),
    path('<int:estimation_id>/pdf/', views.download_estimation_pdf, name='download_estimation_pdf'),
    path('<int:estimation_id>/delete/', views.delete_user_estimation, name='delete_user_estimation'),
]