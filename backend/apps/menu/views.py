from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from apps.accounts.permissions import IsAdmin, IsStaff, IsAdminOrCashier
from apps.core.responses import APIResponse
from rest_framework.decorators import action
import logging

logger = logging.getLogger(__name__)

class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['sequence', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCashier()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        self.perform_create(serializer)
        logger.info(f"Category created: {serializer.data.get('name')} by user {request.user}")
        return APIResponse.created(
            data=serializer.data,
            message='Category created successfully'
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        self.perform_update(serializer)
        logger.info(f"Category updated: {instance.name} by user {request.user}")
        return APIResponse.success(
            data=serializer.data,
            message='Category updated successfully'
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        self.perform_destroy(instance)
        logger.info(f"Category deleted: {name} by user {request.user}")
        return APIResponse.success(message=f'Category {name} deleted successfully')


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for products.
    """
    queryset = Product.objects.all().prefetch_related('variants')
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'has_variants']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'toggle_availability']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCashier()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        self.perform_create(serializer)
        logger.info(f"Product created: {serializer.data.get('name')} by user {request.user}")
        return APIResponse.created(
            data=serializer.data,
            message='Product created successfully'
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        self.perform_update(serializer)
        logger.info(f"Product updated: {instance.name} by user {request.user}")
        return APIResponse.success(
            data=serializer.data,
            message='Product updated successfully'
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        self.perform_destroy(instance)
        logger.info(f"Product deleted: {name} by user {request.user}")
        return APIResponse.success(message=f'Product {name} deleted successfully')

    @action(detail=True, methods=['patch'], permission_classes=[IsStaff], url_path='availability')
    def toggle_availability(self, request, pk=None):
        """
        PATCH /api/menu/products/{id}/availability/
        Toggle is_active status of a product.
        """
        product = self.get_object()
        is_active = request.data.get('is_active')
        
        if is_active is None:
            return APIResponse.error(message="is_active field is required.")
            
        product.is_active = bool(is_active)
        product.save()
        
        return APIResponse.success(
            data=ProductSerializer(product).data,
            message=f"Product availability updated to {'Available' if product.is_active else 'Unavailable'}"
        )

