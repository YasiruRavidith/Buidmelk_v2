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
    """A purchased ticket or bundle of tickets for posting bidding projects or consulting QS."""
    BUNDLE_STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXHAUSTED', 'Exhausted'),
        ('EXPIRED', 'Expired'),
    )
    TICKET_TYPE_CHOICES = (
        ('BIDDING', 'Bidding Ticket'),
        ('QS', 'QS Consultation Ticket'),
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_bundles')
    ticket_type = models.CharField(max_length=20, choices=TICKET_TYPE_CHOICES, default='BIDDING')
    unlocks_total = models.PositiveIntegerField(default=1)
    unlocks_used = models.PositiveIntegerField(default=0)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=1500.00)
    status = models.CharField(max_length=20, choices=BUNDLE_STATUS_CHOICES, default='ACTIVE')
    transaction_ref = models.CharField(max_length=255, blank=True, null=True)
    purchased_at = models.DateTimeField(auto_now_add=True)

    def unlocks_remaining(self):
        return max(0, self.unlocks_total - self.unlocks_used)

    def is_usable(self):
        return self.status == 'ACTIVE' and self.unlocks_remaining() > 0

    def __str__(self):
        return f"{self.get_ticket_type_display()}#{self.id} — {self.owner.email} ({self.unlocks_remaining()} credits remaining)"


class QSConnectionUnlock(models.Model):
    """Records which QS professionals a client has unlocked using a QS ticket."""
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='qs_unlocks')
    qs_professional = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_qs_unlocks')
    bundle = models.ForeignKey(TicketBundle, on_delete=models.SET_NULL, null=True, blank=True, related_name='qs_unlocks')
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('client', 'qs_professional')

    def __str__(self):
        return f"{self.client.email} unlocked QS {self.qs_professional.email}"


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



class ProjectChatMessage(models.Model):
    """Private chat message between project client and accepted professional."""
    project = models.ForeignKey(ProjectPost, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_chat_messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.sender.email} in '{self.project.title}' at {self.created_at}"


class QSChatMessage(models.Model):
    """Private consultation chat message between client and unlocked Quantity Surveyor."""
    unlock = models.ForeignKey(QSConnectionUnlock, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='qs_chat_messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"QS Chat from {self.sender.email} in Unlock#{self.unlock.id} at {self.created_at}"


