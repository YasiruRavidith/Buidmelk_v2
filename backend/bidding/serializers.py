from rest_framework import serializers
from .models import ProjectPost, Bid
from users.serializers import CustomUserSerializer

class BidSerializer(serializers.ModelSerializer):
    professional_details = CustomUserSerializer(source='professional', read_only=True)
    
    class Meta:
        model = Bid
        fields = '__all__'
        read_only_fields = ['professional', 'status']

class ProjectPostSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    bids_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectPost
        fields = '__all__'
        read_only_fields = ['client', 'status']

    def get_bids_count(self, obj):
        return obj.bids.count()

class ProjectPostDetailSerializer(ProjectPostSerializer):
    bids = BidSerializer(many=True, read_only=True)

    class Meta(ProjectPostSerializer.Meta):
        fields = '__all__'
