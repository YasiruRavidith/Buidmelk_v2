from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class MaterialCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="supplier_profile", null=True, blank=True)
    company_name = models.CharField(max_length=200)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.company_name

class Material(models.Model):
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True, null=True)
    category = models.ForeignKey(MaterialCategory, on_delete=models.CASCADE, related_name="materials")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="products", null=True, blank=True)
    unit = models.CharField(max_length=50, help_text="e.g. kg, bag, cube, ton")
    
    # Pricing fields
    ai_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Price fetched by AI automatically")
    manual_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Admins can set this if AI fails or price needs override")
    use_manual_price = models.BooleanField(default=False, help_text="If checked, the manual price is used instead of AI price")
    last_ai_update = models.DateTimeField(null=True, blank=True)
    
    stock_available = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def current_price(self):
        if self.use_manual_price and self.manual_price:
            return self.manual_price
        return self.ai_price if self.ai_price else (self.manual_price or 0)
    
    def __str__(self):
        brand_str = f" ({self.brand})" if self.brand else ""
        return f"{self.name}{brand_str} - Rs.{self.current_price}/{self.unit}"

class MaterialImage(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="images")
    image = models.FileField(upload_to="materials/images/")
    is_main = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.material.name}"


class Brand(models.Model):
    name = models.CharField(max_length=150, unique=True)
    categories = models.ManyToManyField(MaterialCategory, related_name='brands', blank=True)

    def __str__(self):
        return self.name


class Review(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    target_object_id = models.PositiveIntegerField()
    target = GenericForeignKey('target_content_type', 'target_object_id')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('author', 'target_content_type', 'target_object_id')
        ordering = ['-created_at']

    def __str__(self):
        return f'Review by {self.author} for {self.target}'


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Cart for {self.user}'


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    product_object_id = models.PositiveIntegerField()
    product = GenericForeignKey('product_content_type', 'product_object_id')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cart', 'product_content_type', 'product_object_id')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.quantity} x {self.product} in {self.cart}'
