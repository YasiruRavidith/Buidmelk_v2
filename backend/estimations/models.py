from django.db import models
from django.conf import settings

class MaterialPrices(models.Model):
    item_name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50) # e.g., 'sqft', 'bag', 'cube'
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.item_name} - Rs. {self.current_price} per {self.unit}"

class EstimationHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='estimations', null=True, blank=True)
    project_title = models.CharField(max_length=255, default='My Dream Home')
    
    # Inputs
    total_area_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    number_of_floors = models.IntegerField(default=1)
    number_of_rooms = models.IntegerField(default=1)
    quality_level = models.CharField(max_length=50, choices=(('STANDARD', 'Standard'), ('LUXURY', 'Luxury')), default='STANDARD')
    project_details_json = models.JSONField(null=True, blank=True)
    
    # Outputs (Calculated)
    estimated_material_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    estimated_labor_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_estimated_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Detailed breakdown JSON
    breakdown_json = models.JSONField(null=True, blank=True)
    design_recommendation_json = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project_title} - {self.total_area_sqft} sqft ({self.created_at.date()})"
