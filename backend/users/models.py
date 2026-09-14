from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('CLIENT', 'Homeowner'),
        ('PROFESSIONAL', 'Professional/Worker'),
        ('ADMIN', 'System Administrator'),
    )
    firebase_uid = models.CharField(max_length=255, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_image = models.FileField(upload_to='profiles/', max_length=500, blank=True, null=True)

    def __str__(self):
        return self.email or self.username

# FIX: Changed models.fields to models.Model
class ProfessionalProfile(models.Model):
    PROFESSION_CHOICES = (
        ('CONTRACTOR', 'Contractor'),
        ('ENGINEER', 'Engineer'),
        ('LAWYER', 'Lawyer'),
        ('ARCHITECT', 'Architect'),
        ('QS', 'Quantity Surveyor (QS)'),
        ('HARDWARE', 'Hardware Owner'),
        ('WORKER', 'General Worker'),
        ('ELECTRICIAN', 'Electrician'),
        ('PLUMBER', 'Plumber'),
        ('WELDER', 'Welder'),
        ('PAINTER', 'Painter'),
    )
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='professional_profile')
    profession_type = models.CharField(max_length=50, choices=PROFESSION_CHOICES)
    
    # Public Profile Details
    company_name = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.IntegerField(default=0)
    about = models.TextField(blank=True, null=True)
    skills_specialization = models.CharField(max_length=500, blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    education = models.TextField(blank=True, null=True)
    service_areas = models.JSONField(default=list, blank=True)
    pricing_range = models.CharField(max_length=120, blank=True, null=True)
    years_in_business = models.IntegerField(blank=True, null=True)
    team_size = models.IntegerField(blank=True, null=True)
    availability = models.CharField(max_length=120, blank=True, null=True)
    
    SERVICE_PLAN_CHOICES = (
        ('NONE', 'None'),
        ('MONTHLY', 'Monthly Service Fee (LKR 500/mo)'),
        ('YEARLY', 'Yearly Service Fee (LKR 5,000/yr)'),
        ('PRO_MONTHLY', 'Pro Plan Monthly (LKR 550/mo)'),
        ('PRO_YEARLY', 'Pro Plan Yearly (LKR 5,000/yr)'),
    )
    SERVICE_STATUS_CHOICES = (
        ('INACTIVE', 'Inactive'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
    )

    # Verification & Stats
    is_verified = models.BooleanField(default=False)
    badge_expires_at = models.DateTimeField(null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    projects_completed = models.IntegerField(default=0)

    # Monetization & Subscriptions
    registration_fee_paid = models.BooleanField(default=False)
    registration_fee_paid_at = models.DateTimeField(null=True, blank=True)
    service_fee_plan = models.CharField(max_length=30, choices=SERVICE_PLAN_CHOICES, default='NONE')
    service_fee_status = models.CharField(max_length=20, choices=SERVICE_STATUS_CHOICES, default='INACTIVE')
    service_fee_expires_at = models.DateTimeField(null=True, blank=True)

    def is_service_active(self):
        from django.utils import timezone
        if self.service_fee_status == 'ACTIVE':
            if self.service_fee_expires_at:
                return self.service_fee_expires_at > timezone.now()
            return True
        return False

    def is_badge_active(self):
        from django.utils import timezone
        if self.is_verified:
            if self.badge_expires_at:
                return self.badge_expires_at > timezone.now()
            return True
        return False

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_profession_type_display()}"


class PaymentTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('REGISTRATION_FEE', 'Professional Registration Fee (LKR 1,000)'),
        ('SERVICE_FEE_MONTHLY', 'Monthly Service Fee (LKR 500)'),
        ('SERVICE_FEE_YEARLY', 'Yearly Service Fee (LKR 5,000)'),
        ('VERIFIED_BADGE_YEARLY', 'Verified Badge Annual (LKR 1,000)'),
        ('PRO_PLAN_MONTHLY', 'Pro Plan Monthly (LKR 550)'),
        ('PRO_PLAN_YEARLY', 'Pro Plan Yearly (LKR 5,000)'),
        ('BIDDING_TICKET', 'Client Bidding Ticket (LKR 1,500)'),
        ('QS_TICKET', 'Client QS Consultation Ticket (LKR 2,500)'),
        ('TICKET_PRO_PLAN', 'Client Ticket Pro Plan'),
    )
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='payment_transactions')
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, default='MOCK_PAYMENT')
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, default='COMPLETED')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.get_transaction_type_display()} - LKR {self.amount}"


class ProfessionalPortfolioImage(models.Model):
    profile = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='portfolio_images')
    image = models.FileField(upload_to='professional/portfolio/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not getattr(self, '_watermark_applied', False):
            from core.watermark import add_watermark_to_file
            add_watermark_to_file(self.image, text="BUILDME.LK")
            self._watermark_applied = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Portfolio image for {self.profile.user.email or self.profile.user.username}"


class ProfessionalCertificationImage(models.Model):
    profile = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='certification_images')
    image = models.FileField(upload_to='professional/certifications/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not getattr(self, '_watermark_applied', False):
            from core.watermark import add_watermark_to_file
            add_watermark_to_file(self.image, text="BUILDME.LK VERIFIED")
            self._watermark_applied = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certification image for {self.profile.user.email or self.profile.user.username}"


class HardwareOwnerProfile(models.Model):
    profile = models.OneToOneField(ProfessionalProfile, on_delete=models.CASCADE, related_name='hardware_profile')
    shop_name = models.CharField(max_length=255, blank=True, null=True)
    shop_address = models.TextField(blank=True, null=True)
    shop_phone = models.CharField(max_length=30, blank=True, null=True)
    shop_email = models.EmailField(blank=True, null=True)
    business_registration = models.CharField(max_length=255, blank=True, null=True)
    opening_hours = models.CharField(max_length=255, blank=True, null=True)
    services = models.TextField(blank=True, null=True)
    google_maps_link = models.URLField(max_length=500, blank=True, null=True)
    banner_image = models.FileField(upload_to='hardware/banners/', blank=True, null=True)

    def __str__(self):
        return f"Hardware profile for {self.profile.user.email or self.profile.user.username}"


class HardwareGalleryImage(models.Model):
    hardware_profile = models.ForeignKey(HardwareOwnerProfile, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.FileField(upload_to='hardware/gallery/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not getattr(self, '_watermark_applied', False):
            from core.watermark import add_watermark_to_file
            add_watermark_to_file(self.image, text="BUILDME.LK")
            self._watermark_applied = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Gallery image for {self.hardware_profile.profile.user.email or self.hardware_profile.profile.user.username}"


class HardwareShop(models.Model):
    profile = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='hardware_shops')
    shop_name = models.CharField(max_length=255)
    shop_address = models.TextField(blank=True, null=True)
    shop_phone = models.CharField(max_length=30, blank=True, null=True)
    shop_email = models.EmailField(blank=True, null=True)
    business_registration = models.CharField(max_length=255, blank=True, null=True)
    opening_hours = models.CharField(max_length=255, blank=True, null=True)
    services = models.TextField(blank=True, null=True)
    google_maps_link = models.URLField(max_length=500, blank=True, null=True)
    banner_image = models.FileField(upload_to='hardware/shops/banners/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shop_name} ({self.profile.user.email or self.profile.user.username})"


class HardwareShopImage(models.Model):
    shop = models.ForeignKey(HardwareShop, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.FileField(upload_to='hardware/shops/gallery/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not getattr(self, '_watermark_applied', False):
            from core.watermark import add_watermark_to_file
            add_watermark_to_file(self.image, text="BUILDME.LK")
            self._watermark_applied = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Shop image for {self.shop.shop_name}"


class HardwareShopItem(models.Model):
    shop = models.ForeignKey(HardwareShop, on_delete=models.CASCADE, related_name='items')
    material = models.ForeignKey('marketplace.Material', on_delete=models.CASCADE, related_name='hardware_shop_items')
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('shop', 'material')

    def __str__(self):
        return f"{self.shop.shop_name} - {self.material.name}"