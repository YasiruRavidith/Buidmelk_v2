from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ProjectPost, Bid
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
