from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyJob, JobApplication
from .serializers import DailyJobSerializer, DailyJobDetailSerializer, JobApplicationSerializer


class DailyJobViewSet(viewsets.ModelViewSet):
    """
    list    GET  /api/workers/jobs/          — public feed
    create  POST /api/workers/jobs/          — authenticated (client / site manager)
    retrieve GET /api/workers/jobs/<id>/     — public detail
    """

    def get_queryset(self):
        qs = DailyJob.objects.all().order_by('-created_at')

        worker_type = self.request.query_params.get('worker_type')
        location = self.request.query_params.get('location')
        job_date = self.request.query_params.get('job_date')  # YYYY-MM-DD
        status_filter = self.request.query_params.get('status', 'OPEN')

        if worker_type and worker_type != 'ALL':
            qs = qs.filter(worker_type=worker_type)
        if location:
            qs = qs.filter(location__icontains=location)
        if job_date:
            qs = qs.filter(job_date=job_date)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DailyJobDetailSerializer
        return DailyJobSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        """POST /api/workers/jobs/<id>/apply/ — worker applies to a job."""
        job = self.get_object()
        user = request.user

        if job.posted_by == user:
            return Response({"error": "You cannot apply to your own job."}, status=status.HTTP_400_BAD_REQUEST)

        if not job.is_still_open():
            return Response({"error": "This job is no longer open."}, status=status.HTTP_400_BAD_REQUEST)

        if JobApplication.objects.filter(job=job, worker=user).exists():
            return Response({"error": "You have already applied to this job."}, status=status.HTTP_400_BAD_REQUEST)

        application = JobApplication.objects.create(
            job=job,
            worker=user,
            message=request.data.get('message', ''),
        )
        serializer = JobApplicationSerializer(application, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_application(self, request, pk=None):
        """GET /api/workers/jobs/<id>/my_application/ — check if current user has applied."""
        job = self.get_object()
        try:
            app = JobApplication.objects.get(job=job, worker=request.user)
            return Response(JobApplicationSerializer(app, context={'request': request}).data)
        except JobApplication.DoesNotExist:
            return Response({"applied": False})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_posted(self, request):
        """GET /api/workers/jobs/my_posted/ — jobs posted by the current user."""
        jobs = DailyJob.objects.filter(posted_by=request.user).order_by('-created_at')
        serializer = DailyJobSerializer(jobs, many=True, context={'request': request})
        return Response(serializer.data)


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Workers see their own applications
        return JobApplication.objects.filter(worker=user).order_by('-applied_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        """POST /api/workers/applications/<id>/accept/ — job poster accepts an applicant."""
        application = self.get_object()
        job = application.job

        if job.posted_by != request.user:
            return Response({"error": "Only the job poster can accept applicants."}, status=status.HTTP_403_FORBIDDEN)

        if not job.is_still_open():
            return Response({"error": "Job already filled."}, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'ACCEPTED'
        application.save()

        # If we've now filled all spots, mark job as FILLED
        if job.workers_accepted() >= job.workers_needed:
            job.status = 'FILLED'
            job.save()
            # Reject remaining pending applications
            job.applications.filter(status='APPLIED').update(status='REJECTED')

        return Response({"message": f"Applicant accepted successfully.", "workers_accepted": job.workers_accepted()})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """POST /api/workers/applications/<id>/reject/ — reject an applicant."""
        application = self.get_object()
        job = application.job

        if job.posted_by != request.user:
            return Response({"error": "Only the job poster can reject applicants."}, status=status.HTTP_403_FORBIDDEN)

        application.status = 'REJECTED'
        application.save()
        return Response({"message": "Applicant rejected."})
