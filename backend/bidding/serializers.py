from rest_framework import serializers
from .models import ProjectPost, Bid
from users.serializers import CustomUserSerializer
from estimations.serializers import EstimationHistorySerializer

class BidSerializer(serializers.ModelSerializer):
    professional_details = CustomUserSerializer(source='professional', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Bid
        fields = '__all__'
        read_only_fields = ['professional', 'status']

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

    class Meta(ProjectPostSerializer.Meta):
        fields = [
            'id', 'client', 'client_name', 'client_firebase_uid', 'estimation', 'estimation_details',
            'title', 'description', 'location', 'budget_range', 'status',
            'created_at', 'bids_count', 'bids',
        ]
        read_only_fields = ['client', 'status']
