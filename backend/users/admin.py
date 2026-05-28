from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    ProfessionalProfile,
    ProfessionalPortfolioImage,
    ProfessionalCertificationImage,
    HardwareOwnerProfile,
    HardwareGalleryImage,
    HardwareShop,
    HardwareShopImage,
    HardwareShopItem,
)

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'is_staff', 'is_email_verified']
    fieldsets = UserAdmin.fieldsets + (
        ('BuildMe Custom Info', {
            'fields': ('role', 'firebase_uid', 'phone_number', 'is_email_verified', 'profile_image')
        }),
    )

class ProfessionalPortfolioImageInline(admin.TabularInline):
    model = ProfessionalPortfolioImage
    extra = 1

class ProfessionalCertificationImageInline(admin.TabularInline):
    model = ProfessionalCertificationImage
    extra = 1

class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'profession_type', 'is_verified', 'rating']
    list_filter = ['profession_type', 'is_verified']
    search_fields = ['user__email', 'company_name']
    inlines = [ProfessionalPortfolioImageInline, ProfessionalCertificationImageInline]

class HardwareGalleryImageInline(admin.TabularInline):
    model = HardwareGalleryImage
    extra = 1

class HardwareOwnerProfileAdmin(admin.ModelAdmin):
    list_display = ['profile', 'shop_name', 'shop_phone']
    search_fields = ['shop_name', 'profile__user__email']
    inlines = [HardwareGalleryImageInline]

class HardwareShopImageInline(admin.TabularInline):
    model = HardwareShopImage
    extra = 1

class HardwareShopItemInline(admin.TabularInline):
    model = HardwareShopItem
    extra = 1

class HardwareShopAdmin(admin.ModelAdmin):
    list_display = ['shop_name', 'profile', 'shop_phone']
    search_fields = ['shop_name', 'profile__user__email']
    inlines = [HardwareShopItemInline, HardwareShopImageInline]

# Register them to the admin site
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(ProfessionalProfile, ProfessionalProfileAdmin)
admin.site.register(HardwareOwnerProfile, HardwareOwnerProfileAdmin)
admin.site.register(HardwareShop, HardwareShopAdmin)