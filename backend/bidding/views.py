from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ProjectPost, Bid, ProjectUnlock
from .serializers import ProjectPostSerializer, ProjectPostDetailSerializer, BidSerializer

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

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

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

        # Check if project owner has unlocked the project using a ticket credit
        if project.ticket_required and not ProjectUnlock.objects.filter(user=request.user, project=project).exists():
            return Response(
                {"error": "You must unlock this project with a ticket credit before accepting proposals."},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # Accept this bid and reject all others automatically
        bid.status = 'ACCEPTED'
        bid.save()

        project.status = 'IN_PROGRESS'
        project.save()

        project.bids.exclude(id=bid.id).update(status='REJECTED')

        return Response({"message": "Bid accepted successfully"})
