from django.db import models
from django.conf import settings
from estimations.models import EstimationHistory

class ProjectPost(models.Model):
    STATUS_CHOICES = (
        ('OPEN', 'Open for Bids'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled')
    )

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posted_projects')
    estimation = models.ForeignKey(EstimationHistory, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    budget_range = models.CharField(max_length=100, blank=True, null=True) # e.g., "5M - 6M LKR"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class Bid(models.Model):
    BID_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected')
    )

    project = models.ForeignKey(ProjectPost, on_delete=models.CASCADE, related_name='bids')
    professional = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_bids')
    bid_amount = models.DecimalField(max_digits=15, decimal_places=2)
    cover_letter = models.TextField()
    estimated_days = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=BID_STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bid by {self.professional.username} on {self.project.title}"
