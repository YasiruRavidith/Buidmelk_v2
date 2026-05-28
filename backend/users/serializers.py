import re
from urllib.parse import quote

from rest_framework import serializers
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


def _extract_google_maps_src(value):
    if not value:
        return ""

    value = str(value).strip()
    if "<iframe" in value.lower():
        match = re.search(r'src=["\']([^"\']+)["\']', value, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return value


def _normalize_google_maps_input(value):
    source = _extract_google_maps_src(value)
    return source.strip() if source else ""


def _build_google_maps_embed(value, fallback_text):
    source = _extract_google_maps_src(value)
    if source and ("/maps/embed" in source or "output=embed" in source):
        return source

    query = fallback_text or source or ""
    if not query:
        return ""
    return f"https://www.google.com/maps?q={quote(query)}&output=embed"


class ProfessionalPortfolioImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalPortfolioImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProfessionalCertificationImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalCertificationImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class HardwareGalleryImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HardwareGalleryImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class HardwareOwnerProfileSerializer(serializers.ModelSerializer):
    banner_image_url = serializers.SerializerMethodField()
    gallery_images = HardwareGalleryImageSerializer(many=True, read_only=True)
    google_maps_link = serializers.SerializerMethodField()

    class Meta:
        model = HardwareOwnerProfile
        fields = [
            'shop_name',
            'shop_address',
            'shop_phone',
            'shop_email',
            'business_registration',
            'opening_hours',
            'services',
            'banner_image',
            'banner_image_url',
            'gallery_images',
            'google_maps_link',
        ]

    def get_banner_image_url(self, obj):
        request = self.context.get('request')
        if obj.banner_image and hasattr(obj.banner_image, 'url'):
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None

    def get_google_maps_link(self, obj):
        return _build_google_maps_embed(obj.google_maps_link, obj.shop_address or obj.shop_name)


class HardwareShopImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HardwareShopImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class HardwareShopSerializer(serializers.ModelSerializer):
    banner_image_url = serializers.SerializerMethodField()
    gallery_images = HardwareShopImageSerializer(many=True, read_only=True)
    google_maps_link = serializers.SerializerMethodField()

    class Meta:
        model = HardwareShop
        fields = [
            'id',
            'shop_name',
            'shop_address',
            'shop_phone',
            'shop_email',
            'business_registration',
            'opening_hours',
            'services',
            'banner_image',
            'banner_image_url',
            'gallery_images',
            'google_maps_link',
            'created_at',
        ]

    def get_banner_image_url(self, obj):
        request = self.context.get('request')
        if obj.banner_image and hasattr(obj.banner_image, 'url'):
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None

    def get_google_maps_link(self, obj):
        return _build_google_maps_embed(obj.google_maps_link, obj.shop_address or obj.shop_name)


class HardwareShopItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    material_unit_price = serializers.DecimalField(source='material.current_price', max_digits=12, decimal_places=2, read_only=True)
    material_category_name = serializers.CharField(source='material.category.name', read_only=True)

    class Meta:
        model = HardwareShopItem
        fields = [
            'id',
            'material',
            'material_name',
            'material_unit',
            'material_unit_price',
            'material_category_name',
            'stock_quantity',
            'is_active',
            'created_at',
        ]


class HardwareShopPublicSerializer(serializers.ModelSerializer):
    banner_image_url = serializers.SerializerMethodField()
    gallery_images = HardwareShopImageSerializer(many=True, read_only=True)
    items = HardwareShopItemSerializer(many=True, read_only=True)
    google_maps_link = serializers.SerializerMethodField()

    class Meta:
        model = HardwareShop
        fields = [
            'id',
            'shop_name',
            'shop_address',
            'shop_phone',
            'shop_email',
            'business_registration',
            'opening_hours',
            'services',
            'banner_image',
            'banner_image_url',
            'gallery_images',
            'items',
            'google_maps_link',
            'created_at',
        ]

    def get_banner_image_url(self, obj):
        request = self.context.get('request')
        if obj.banner_image and hasattr(obj.banner_image, 'url'):
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None

    def get_google_maps_link(self, obj):
        return _build_google_maps_embed(obj.google_maps_link, obj.shop_address or obj.shop_name)

class ProfessionalProfileSerializer(serializers.ModelSerializer):
    portfolio_images = ProfessionalPortfolioImageSerializer(many=True, read_only=True)
    certification_images = ProfessionalCertificationImageSerializer(many=True, read_only=True)
    hardware_profile = HardwareOwnerProfileSerializer(read_only=True)

    class Meta:
        model = ProfessionalProfile
        fields = [
            'profession_type', 'company_name', 'location', 
            'years_of_experience', 'about', 'skills_specialization',
            'certifications', 'education', 'service_areas',
            'pricing_range', 'years_in_business', 'team_size', 'availability',
            'is_verified', 'rating', 'projects_completed',
            'portfolio_images', 'certification_images', 'hardware_profile'
        ]

class CustomUserSerializer(serializers.ModelSerializer):
    professional_profile = ProfessionalProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'phone_number', 'profile_image', 
            'is_email_verified', 'professional_profile'
        ]


class OnboardingSerializer(serializers.Serializer):
    token = serializers.CharField()
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)
    profession_type = serializers.ChoiceField(
        choices=ProfessionalProfile.PROFESSION_CHOICES,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        role = attrs.get('role')
        profession_type = attrs.get('profession_type')

        if role == 'PROFESSIONAL' and not profession_type:
            raise serializers.ValidationError({
                'profession_type': 'This field is required for professionals.'
            })

        return attrs


class ProfileUpdateSerializer(serializers.Serializer):
    token = serializers.CharField()
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    profession_type = serializers.ChoiceField(
        choices=ProfessionalProfile.PROFESSION_CHOICES,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    company_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    years_of_experience = serializers.IntegerField(required=False, min_value=0, allow_null=True)
    about = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    skills_specialization = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    certifications = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    education = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    service_areas = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )
    pricing_range = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    years_in_business = serializers.IntegerField(required=False, min_value=0, allow_null=True)
    team_size = serializers.IntegerField(required=False, min_value=0, allow_null=True)
    availability = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    shop_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    shop_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    shop_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    shop_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    business_registration = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    opening_hours = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    services = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    google_maps_link = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_google_maps_link(self, value):
        return _normalize_google_maps_input(value)


class HardwareShopCreateSerializer(serializers.Serializer):
    token = serializers.CharField()
    shop_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    shop_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    shop_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    shop_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    business_registration = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    opening_hours = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    services = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    google_maps_link = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_google_maps_link(self, value):
        return _normalize_google_maps_input(value)


class HardwareShopItemCreateSerializer(serializers.Serializer):
    token = serializers.CharField()
    material_id = serializers.IntegerField()
    stock_quantity = serializers.IntegerField(required=False, min_value=0, default=0)


class HardwareShopItemUpdateSerializer(serializers.Serializer):
    token = serializers.CharField()
    stock_quantity = serializers.IntegerField(required=False, min_value=0)
    is_active = serializers.BooleanField(required=False)
