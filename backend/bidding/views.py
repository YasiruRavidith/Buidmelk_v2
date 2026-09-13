from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db import transaction as db_transaction
from django.db.models import Q
from .models import ProjectPost, Bid, ProjectUnlock, TicketBundle, ProjectChatMessage
from .serializers import (
    ProjectPostSerializer, ProjectPostDetailSerializer, BidSerializer,
    ProjectChatMessageSerializer
)
from users.views import _resolve_user

class ProjectPostViewSet(viewsets.ModelViewSet):
    queryset = ProjectPost.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectPostDetailSerializer
        return ProjectPostSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        user = request.user
        # For CLIENT role: require an active Bidding Ticket (LKR 1,500 per tender)
        if getattr(user, 'role', '') == 'CLIENT':
            bundle = (
                TicketBundle.objects
                .filter(owner=user, status='ACTIVE')
                .order_by('purchased_at')
                .first()
            )

            if not bundle or not bundle.is_usable():
                return Response(
                    {
                        "error": "A bidding ticket (LKR 1,500) is required to publish a project tender.",
                        "needs_ticket": True,
                        "ticket_price": 1500.00,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            with db_transaction.atomic():
                bundle.unlocks_used += 1
                if bundle.unlocks_remaining() == 0:
                    bundle.status = 'EXHAUSTED'
                bundle.save(update_fields=['unlocks_used', 'status'])
                return super().create(request, *args, **kwargs)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['get', 'post'], url_path='chat')
    def chat(self, request, pk=None):
        project = self.get_object()
        user, err = _resolve_user(request)
        if not user or not user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if project has an accepted bid
        accepted_bid = project.bids.filter(status='ACCEPTED').first()
        if not accepted_bid:
            return Response(
                {"error": "No bid has been accepted yet for this project. Private chat is available once a bid is accepted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Strict privacy check: only project client or the accepted contractor (or admin)
        is_client = (project.client_id == user.id)
        is_contractor = (accepted_bid.professional_id == user.id)
        is_admin = getattr(user, 'role', '') == 'ADMIN'

        if not (is_client or is_contractor or is_admin):
            return Response(
                {"error": "Access denied. Private chat is strictly confidential between the client and the accepted professional."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            # Mark messages received from the other party as read
            project.chat_messages.exclude(sender=user).filter(is_read=False).update(is_read=True)

            messages = project.chat_messages.all().select_related('sender').order_by('created_at')
            serializer = ProjectChatMessageSerializer(
                messages,
                many=True,
                context={'request': request, 'request_user': user}
            )

            client_user = project.client
            prof_user = accepted_bid.professional
            return Response({
                "project_id": project.id,
                "project_title": project.title,
                "client": {
                    "id": client_user.id,
                    "name": f"{client_user.first_name} {client_user.last_name}".strip() or client_user.username,
                    "profile_image": client_user.profile_image.url if getattr(client_user, 'profile_image', None) else None,
                },
                "professional": {
                    "id": prof_user.id,
                    "name": f"{prof_user.first_name} {prof_user.last_name}".strip() or prof_user.username,
                    "company_name": getattr(getattr(prof_user, 'professional_profile', None), 'company_name', ''),
                    "profile_image": prof_user.profile_image.url if getattr(prof_user, 'profile_image', None) else None,
                },
                "accepted_bid": {
                    "id": accepted_bid.id,
                    "amount": str(accepted_bid.bid_amount),
                    "timeline_days": accepted_bid.estimated_days,
                },
                "messages": serializer.data,
            })

        elif request.method == 'POST':
            raw_message = request.data.get('message', '')
            if not raw_message or not str(raw_message).strip():
                return Response({"error": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

            chat_msg = ProjectChatMessage.objects.create(
                project=project,
                sender=user,
                message=str(raw_message).strip()
            )

            serializer = ProjectChatMessageSerializer(
                chat_msg,
                context={'request': request, 'request_user': user}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class BidViewSet(viewsets.ModelViewSet):
    queryset = Bid.objects.none()
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'PROFESSIONAL':
                return Bid.objects.filter(professional=user).order_by('-created_at')
            elif user.role == 'CLIENT':
                return Bid.objects.filter(project__client=user).order_by('-created_at')
        return Bid.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        # For PROFESSIONAL: Check registration fee & active service fee
        if getattr(user, 'role', '') == 'PROFESSIONAL':
            profile = getattr(user, 'professional_profile', None)
            if not profile or not profile.registration_fee_paid:
                return Response(
                    {
                        "error": "One-time registration fee (LKR 1,000) is required to activate bidding access.",
                        "needs_registration": True,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            if not profile.is_service_active():
                return Response(
                    {
                        "error": "An active service fee subscription (Monthly LKR 500 or Pro Plan) is required to submit bids.",
                        "needs_service_fee": True,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(professional=self.request.user)

    def destroy(self, request, *args, **kwargs):
        bid = self.get_object()
        if bid.professional != request.user and getattr(request.user, 'role', '') != 'ADMIN':
            return Response({"error": "You can only delete your own submitted bids."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        bid = self.get_object()
        project = bid.project

        # Only the project owner can accept a bid
        if project.client != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        # Accept this bid and reject all others automatically
        bid.status = 'ACCEPTED'
        bid.save()

        project.status = 'IN_PROGRESS'
        project.save()

        project.bids.exclude(id=bid.id).update(status='REJECTED')

        return Response({"message": "Bid accepted successfully"})


@api_view(['GET'])
def my_chat_conversations(request):
    """
    Returns all active 1-on-1 project chat conversations for the current user
    (either as the project client or the accepted professional), along with unread counts.
    """
    user, err = _resolve_user(request)
    if not user or not user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    # Find projects with accepted bids where user is client OR accepted professional
    projects = ProjectPost.objects.filter(
        Q(client=user) | Q(bids__professional=user, bids__status='ACCEPTED')
    ).filter(bids__status='ACCEPTED').distinct().order_by('-created_at')

    conversations = []
    total_unread = 0

    for proj in projects:
        accepted_bid = proj.bids.filter(status='ACCEPTED').select_related('professional', 'professional__professional_profile').first()
        if not accepted_bid:
            continue

        is_client = (proj.client_id == user.id)
        counterpart = accepted_bid.professional if is_client else proj.client
        if not counterpart:
            continue

        counterpart_name = f"{counterpart.first_name} {counterpart.last_name}".strip() or counterpart.username
        company_name = ""
        if counterpart.role == 'PROFESSIONAL':
            company_name = getattr(getattr(counterpart, 'professional_profile', None), 'company_name', '')

        # Unread messages from counterpart
        unread_count = proj.chat_messages.exclude(sender=user).filter(is_read=False).count()
        total_unread += unread_count

        # Latest message
        last_msg_obj = proj.chat_messages.select_related('sender').order_by('-created_at').first()
        last_msg_data = None
        last_activity_time = proj.created_at

        if last_msg_obj:
            last_msg_data = {
                "id": last_msg_obj.id,
                "message": last_msg_obj.message,
                "sender_id": last_msg_obj.sender_id,
                "sender_name": f"{last_msg_obj.sender.first_name} {last_msg_obj.sender.last_name}".strip() or last_msg_obj.sender.username,
                "is_me": (last_msg_obj.sender_id == user.id),
                "is_read": last_msg_obj.is_read,
                "created_at": last_msg_obj.created_at.isoformat(),
            }
            last_activity_time = last_msg_obj.created_at

        conversations.append({
            "project_id": proj.id,
            "project_title": proj.title,
            "project_status": proj.status,
            "location": proj.location,
            "accepted_bid": {
                "id": accepted_bid.id,
                "bid_amount": str(accepted_bid.bid_amount),
                "estimated_days": accepted_bid.estimated_days,
            },
            "counterpart": {
                "id": counterpart.id,
                "name": counterpart_name,
                "role": counterpart.role,
                "company_name": company_name,
                "profile_image": counterpart.profile_image.url if getattr(counterpart, 'profile_image', None) else None,
            },
            "last_message": last_msg_data,
            "unread_count": unread_count,
            "last_activity_time": last_activity_time.isoformat(),
        })

    # Sort conversations by last activity time descending
    conversations.sort(key=lambda c: c['last_activity_time'], reverse=True)

    return Response({
        "total_unread": total_unread,
        "conversations": conversations,
    })

