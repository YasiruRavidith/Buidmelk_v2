from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import ticket_views

router = DefaultRouter()
router.register(r'projects', views.ProjectPostViewSet)
router.register(r'bids', views.BidViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Private Chat Conversations
    path('chats/', views.my_chat_conversations, name='my_chat_conversations'),
    # Ticket system
    path('tickets/purchase/', ticket_views.purchase_ticket_bundle, name='purchase_ticket_bundle'),
    path('tickets/my/', ticket_views.my_ticket_bundles, name='my_ticket_bundles'),
    path('tickets/unlocked/', ticket_views.my_unlocked_projects, name='my_unlocked_projects'),
    path('tickets/unlock/<int:project_id>/', ticket_views.unlock_project, name='unlock_project'),
    path('tickets/check/<int:project_id>/', ticket_views.check_project_unlock, name='check_project_unlock'),
]