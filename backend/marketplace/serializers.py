from rest_framework import serializers
from .models import MaterialCategory, Supplier, Material, MaterialImage, Review, Cart, CartItem
from users.models import HardwareShop, HardwareShopItem, CustomUser

class MaterialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialCategory
        fields = '__all__'

class HardwareShopItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    material_unit_price = serializers.DecimalField(source='material.current_price', max_digits=12, decimal_places=2, read_only=True)
    material_category_name = serializers.CharField(source='material.category.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HardwareShopItem
        fields = [
            'id',
            'material',
            'material_name',
            'material_unit',
            'material_unit_price',
            'material_category_name',
            'image_url',
            'stock_quantity',
            'is_active',
            'created_at',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        image = obj.material.images.first()
        if image and image.image:
            url = image.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    current_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    images = serializers.SerializerMethodField()

    def get_images(self, obj):
        # Return image urls (absolute when request available) and metadata
        request = self.context.get('request')
        out = []
        for img in getattr(obj, 'images').all():
            url = img.image.url if img.image else None
            if url and request:
                url = request.build_absolute_uri(url)
            out.append({
                'id': img.id,
                'image_url': url,
                'is_main': img.is_main,
            })
        return out

    class Meta:
        model = Material
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(source='categories', many=True, read_only=True)

    class Meta:
        model = getattr(__import__('marketplace.models', fromlist=['Brand']), 'Brand')
        fields = ['id', 'name', 'category_ids']


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    target_label = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'author', 'author_name', 'target_label', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['author', 'author_name', 'target_label', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_target_label(self, obj):
        target = obj.target
        if isinstance(target, Material):
            return target.name
        if isinstance(target, HardwareShop):
            return target.shop_name
        if isinstance(target, CustomUser) and getattr(target, 'professional_profile', None):
            return target.professional_profile.company_name or target.get_full_name() or target.username
        return str(target)


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    product_type = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product_name', 'product_image', 'product_type', 'quantity', 'unit_price', 'created_at', 'updated_at']

    def get_product_name(self, obj):
        product = obj.product
        if isinstance(product, Material):
            return product.name
        if isinstance(product, HardwareShopItem):
            return product.material.name
        return str(product)

    def get_product_image(self, obj):
        product = obj.product
        request = self.context.get('request')

        image_url = None
        if isinstance(product, Material):
            image = product.images.first()
            if image and image.image:
                image_url = image.image.url
        elif isinstance(product, HardwareShopItem):
            image = product.material.images.first()
            if image and image.image:
                image_url = image.image.url

        if image_url and request:
            return request.build_absolute_uri(image_url)
        return image_url

    def get_product_type(self, obj):
        product = obj.product
        if isinstance(product, Material):
            return 'material'
        if isinstance(product, HardwareShopItem):
            return 'hardware_shop_item'
        return 'unknown'


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'created_at', 'updated_at']

    def get_total(self, obj):
        total = sum((item.unit_price * item.quantity for item in obj.items.all()), start=0)
        return f'{total:.2f}'
