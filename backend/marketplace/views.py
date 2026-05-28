from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets
from .models import MaterialCategory, Supplier, Material, Review, Cart, CartItem, Brand
from .serializers import MaterialCategorySerializer, SupplierSerializer, MaterialSerializer, BrandSerializer, ReviewSerializer, CartSerializer, CartItemSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny
from rest_framework.decorators import action, permission_classes as drf_permission_classes, api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .services import refresh_material_ai_price
from users.models import CustomUser, HardwareShop, HardwareShopItem
import firebase_admin
from firebase_admin import auth


TARGET_MODEL_MAP = {
    'material': Material,
    'professional': CustomUser,
    'shop': HardwareShop,
}

PRODUCT_MODEL_MAP = {
    'material': Material,
    'hardware_shop_item': HardwareShopItem,
}


def _get_user_from_token(token):
    if not token:
        return None, Response({'detail': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get('uid')
        user = CustomUser.objects.get(firebase_uid=uid)
        return user, None
    except CustomUser.DoesNotExist:
        return None, Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        return None, Response({'detail': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)


def _resolve_target(target_type, target_id):
    model = TARGET_MODEL_MAP.get(target_type)
    if not model:
        return None, Response({'detail': 'Unsupported target type.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target = model.objects.get(id=target_id)
    except model.DoesNotExist:
        return None, Response({'detail': 'Target not found.'}, status=status.HTTP_404_NOT_FOUND)

    if target_type == 'professional' and getattr(target, 'role', None) != 'PROFESSIONAL':
        return None, Response({'detail': 'Target is not a professional.'}, status=status.HTTP_400_BAD_REQUEST)

    return target, None


def _resolve_product(product_type, product_id):
    model = PRODUCT_MODEL_MAP.get(product_type)
    if not model:
        return None, Response({'detail': 'Unsupported product type.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if model is Material:
            product = model.objects.select_related('category', 'supplier').prefetch_related('images').get(id=product_id)
        else:
            product = model.objects.select_related('material', 'shop', 'material__category', 'material__supplier').get(id=product_id)
    except model.DoesNotExist:
        return None, Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    return product, None

class MaterialCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MaterialCategory.objects.all()
    serializer_class = MaterialCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class SupplierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().select_related('category', 'supplier').prefetch_related('images')
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # We can add filtering by category, search by name etc.
    filterset_fields = ['category', 'supplier']
    search_fields = ['name', 'description']

    @action(detail=True, methods=['post'])
    @drf_permission_classes([IsAdminUser])
    def refresh_ai(self, request, pk=None):
        """Manually trigger AI price refresh for a material (admin only)."""
        material = self.get_object()
        try:
            updated = refresh_material_ai_price(material, force=True)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'updated': bool(updated), 'ai_price': str(material.ai_price) if material.ai_price is not None else None})

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """Provides a read-only list/detail endpoint for Brand.

    Supports filtering by category id via `?category=<id>`.
    """
    queryset = getattr(__import__('marketplace.models', fromlist=['Brand']), 'Brand').objects.all()
    serializer_class = BrandSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(categories__id=category)
        return qs.distinct()


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def reviews(request):
    if request.method == 'GET':
        target_type = request.query_params.get('target_type')
        target_id = request.query_params.get('target_id')
        queryset = Review.objects.select_related('author', 'target_content_type')

        if target_type and target_id:
            model = TARGET_MODEL_MAP.get(target_type)
            if not model:
                return Response({'detail': 'Unsupported target type.'}, status=status.HTTP_400_BAD_REQUEST)
            content_type = ContentType.objects.get_for_model(model)
            queryset = queryset.filter(target_content_type=content_type, target_object_id=target_id)

        serializer = ReviewSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    token = request.data.get('token')
    user, error_response = _get_user_from_token(token)
    if error_response:
        return error_response

    target_type = request.data.get('target_type')
    target_id = request.data.get('target_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')

    if not target_type or not target_id or rating is None:
        return Response({'detail': 'target_type, target_id, and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)

    target, error_response = _resolve_target(target_type, int(target_id))
    if error_response:
        return error_response

    content_type = ContentType.objects.get_for_model(target.__class__)
    review, _ = Review.objects.update_or_create(
        author=user,
        target_content_type=content_type,
        target_object_id=target.id,
        defaults={'rating': rating, 'comment': comment},
    )

    serializer = ReviewSerializer(review, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def cart(request):
    if request.method == 'GET':
        token = request.query_params.get('token')
        user, error_response = _get_user_from_token(token)
        if error_response:
            return error_response

        cart_obj, _ = Cart.objects.get_or_create(user=user)
        serializer = CartSerializer(cart_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    token = request.data.get('token')
    user, error_response = _get_user_from_token(token)
    if error_response:
        return error_response

    product_type = request.data.get('product_type')
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity') or 1)

    if not product_type or not product_id:
        return Response({'detail': 'product_type and product_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

    product, error_response = _resolve_product(product_type, int(product_id))
    if error_response:
        return error_response

    if product_type == 'material':
        unit_price = product.current_price
    else:
        unit_price = product.material.current_price

    cart_obj, _ = Cart.objects.get_or_create(user=user)
    content_type = ContentType.objects.get_for_model(product.__class__)
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart_obj,
        product_content_type=content_type,
        product_object_id=product.id,
        defaults={'quantity': quantity, 'unit_price': unit_price},
    )

    if not created:
        cart_item.quantity += quantity
        cart_item.unit_price = unit_price
        cart_item.save(update_fields=['quantity', 'unit_price'])

    serializer = CartSerializer(cart_obj, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def cart_update(request, item_id=None):
    token = request.data.get('token')
    user, error_response = _get_user_from_token(token)
    if error_response:
        return error_response

    cart_obj, _ = Cart.objects.get_or_create(user=user)
    item = cart_obj.items.filter(id=request.data.get('item_id')).first()
    if not item:
        return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

    quantity = request.data.get('quantity')
    if quantity is not None:
        item.quantity = int(quantity)
        if item.quantity <= 0:
            item.delete()
            serializer = CartSerializer(cart_obj, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    item.save(update_fields=['quantity', 'updated_at'])
    serializer = CartSerializer(cart_obj, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def cart_remove(request):
    token = request.data.get('token')
    user, error_response = _get_user_from_token(token)
    if error_response:
        return error_response

    cart_obj, _ = Cart.objects.get_or_create(user=user)
    item = cart_obj.items.filter(id=request.data.get('item_id')).first()
    if not item:
        return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

    item.delete()
    serializer = CartSerializer(cart_obj, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
