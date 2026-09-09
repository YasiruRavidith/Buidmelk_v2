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
    budget_range = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    ticket_required = models.BooleanField(default=True)
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


class TicketBundle(models.Model):
    """A purchased bundle of 3 project unlocks."""
    BUNDLE_STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXHAUSTED', 'Exhausted'),
        ('EXPIRED', 'Expired'),
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_bundles')
    unlocks_total = models.PositiveIntegerField(default=3)
    unlocks_used = models.PositiveIntegerField(default=0)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    status = models.CharField(max_length=20, choices=BUNDLE_STATUS_CHOICES, default='ACTIVE')
    transaction_ref = models.CharField(max_length=255, blank=True, null=True)
    purchased_at = models.DateTimeField(auto_now_add=True)

    def unlocks_remaining(self):
        return self.unlocks_total - self.unlocks_used

    def is_usable(self):
        return self.status == 'ACTIVE' and self.unlocks_remaining() > 0

    def __str__(self):
        return f"TicketBundle#{self.id} — {self.owner.email} ({self.unlocks_remaining()} remaining)"


class ProjectUnlock(models.Model):
    """Records which projects a user has unlocked via a ticket bundle."""
    bundle = models.ForeignKey(TicketBundle, on_delete=models.CASCADE, related_name='unlocks')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_unlocks')
    project = models.ForeignKey(ProjectPost, on_delete=models.CASCADE, related_name='unlocks')
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'project')

    def __str__(self):
        return f"{self.user.email} unlocked '{self.project.title}'"
