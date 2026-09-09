from django.db import models
from django.conf import settings


class DailyJob(models.Model):
    WORKER_TYPE_CHOICES = [
        ('PAINTER', 'Painter'),
        ('PLUMBER', 'Plumber'),
        ('ELECTRICIAN', 'Electrician'),
        ('GENERAL', 'General Worker'),
        ('WELDER', 'Welder'),
        ('MASON', 'Mason / Bricklayer'),
        ('CARPENTER', 'Carpenter'),
        ('TILER', 'Tiler'),
        ('DRIVER', 'Driver / Delivery'),
        ('HELPER', 'Site Helper / Labour'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('FILLED', 'Filled'),
        ('EXPIRED', 'Expired'),
    ]

    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_daily_jobs',
    )
    title = models.CharField(max_length=255)
    worker_type = models.CharField(max_length=30, choices=WORKER_TYPE_CHOICES)
    workers_needed = models.PositiveIntegerField(default=1)
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    job_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    def workers_accepted(self):
        return self.applications.filter(status='ACCEPTED').count()

    def is_still_open(self):
        return self.status == 'OPEN' and self.workers_accepted() < self.workers_needed

    def __str__(self):
        return f"{self.title} @ {self.location} on {self.job_date}"


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]

    job = models.ForeignKey(DailyJob, on_delete=models.CASCADE, related_name='applications')
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_applications',
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job', 'worker')

    def __str__(self):
        return f"{self.worker.email} applied to '{self.job.title}' [{self.status}]"
