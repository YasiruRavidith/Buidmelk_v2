from rest_framework import serializers
from .models import ProjectPost, Bid, ProjectChatMessage, QSChatMessage
from users.serializers import CustomUserSerializer
from estimations.serializers import EstimationHistorySerializer

class BidSerializer(serializers.ModelSerializer):
    professional_details = CustomUserSerializer(source='professional', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    professional_rating = serializers.SerializerMethodField()
    professional_projects_completed = serializers.SerializerMethodField()

    class Meta:
        model = Bid
        fields = '__all__'
        read_only_fields = ['professional', 'status']

    def get_professional_rating(self, obj):
        try:
            return str(obj.professional.professional_profile.rating)
        except Exception:
            return None

    def get_professional_projects_completed(self, obj):
        try:
            return obj.professional.professional_profile.projects_completed
        except Exception:
            return None

class ProjectPostSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    client_firebase_uid = serializers.CharField(source='client.firebase_uid', read_only=True)
    bids_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectPost
        fields = '__all__'
        read_only_fields = ['client', 'status']

    def get_bids_count(self, obj):
        return obj.bids.count()

class ProjectPostDetailSerializer(ProjectPostSerializer):
    bids = BidSerializer(many=True, read_only=True)
    estimation_details = EstimationHistorySerializer(source='estimation', read_only=True)
    accepted_bid = serializers.SerializerMethodField()

    class Meta(ProjectPostSerializer.Meta):
        fields = [
            'id', 'client', 'client_name', 'client_firebase_uid', 'estimation', 'estimation_details',
            'title', 'description', 'location', 'budget_range', 'status',
            'created_at', 'bids_count', 'bids', 'accepted_bid',
        ]
        read_only_fields = ['client', 'status']

    def get_accepted_bid(self, obj):
        accepted = obj.bids.filter(status='ACCEPTED').first()
        if accepted:
            return BidSerializer(accepted, context=self.context).data
        return None


class ProjectChatMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_profile_image = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = ProjectChatMessage
        fields = [
            'id', 'project', 'sender_id', 'sender_name', 'sender_role',
            'sender_profile_image', 'is_me', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['project', 'sender', 'created_at']

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name or obj.sender.username or obj.sender.email

    def get_sender_profile_image(self, obj):
        request = self.context.get('request')
        img = obj.sender.profile_image
        if img and hasattr(img, 'url'):
            if request:
                return request.build_absolute_uri(img.url)
            return img.url
        return None

    def get_is_me(self, obj):
        request_user = self.context.get('request_user')
        if request_user:
            return obj.sender_id == request_user.id
        return False


class QSChatMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_profile_image = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = QSChatMessage
        fields = [
            'id', 'unlock', 'sender_id', 'sender_name', 'sender_role',
            'sender_profile_image', 'is_me', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['unlock', 'sender', 'created_at']

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name or obj.sender.username or obj.sender.email

    def get_sender_profile_image(self, obj):
        request = self.context.get('request')
        img = obj.sender.profile_image
        if img and hasattr(img, 'url'):
            if request:
                return request.build_absolute_uri(img.url)
            return img.url
        return None

    def get_is_me(self, obj):
        request_user = self.context.get('request_user')
        if request_user:
            return obj.sender_id == request_user.id
        return False


