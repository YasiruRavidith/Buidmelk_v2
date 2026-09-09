from rest_framework import serializers
from .models import DailyJob, JobApplication
from django.contrib.auth import get_user_model

User = get_user_model()


class ApplicantSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'profile_image']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_profile_image(self, obj):
        request = self.context.get('request')
        if obj.profile_image and request:
            return request.build_absolute_uri(obj.profile_image.url)
        return None


class JobApplicationSerializer(serializers.ModelSerializer):
    worker_details = ApplicantSerializer(source='worker', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'job_title', 'worker', 'worker_details', 'message', 'status', 'applied_at']
        read_only_fields = ['worker', 'status', 'applied_at']


class DailyJobSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()
    posted_by_firebase_uid = serializers.CharField(source='posted_by.firebase_uid', read_only=True)
    workers_accepted = serializers.SerializerMethodField()
    is_still_open = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = DailyJob
        fields = [
            'id', 'title', 'worker_type', 'workers_needed', 'location',
            'description', 'daily_rate', 'job_date', 'status',
            'posted_by', 'posted_by_name', 'posted_by_firebase_uid',
            'workers_accepted', 'is_still_open', 'applications_count',
            'created_at',
        ]
        read_only_fields = ['posted_by', 'status']

    def get_posted_by_name(self, obj):
        return obj.posted_by.get_full_name() or obj.posted_by.username

    def get_workers_accepted(self, obj):
        return obj.workers_accepted()

    def get_is_still_open(self, obj):
        return obj.is_still_open()

    def get_applications_count(self, obj):
        return obj.applications.count()


class DailyJobDetailSerializer(DailyJobSerializer):
    applications = JobApplicationSerializer(many=True, read_only=True)

    class Meta(DailyJobSerializer.Meta):
        fields = DailyJobSerializer.Meta.fields + ['applications']
