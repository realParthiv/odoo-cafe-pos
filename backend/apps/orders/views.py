from rest_framework import viewsets, status, permissions, views, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
import logging

logger = logging.getLogger(__name__)
from rest_framework.response import Response
from django.utils import timezone
from apps.core.responses import APIResponse
from .models import Order, OrderLine
from .serializers import OrderSerializer, OrderLineSerializer
from apps.sessions.models import POSSession

class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for orders.
    """
    queryset = Order.objects.all().prefetch_related('lines', 'lines__product', 'lines__variant')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'order_type', 'session', 'table']
    search_fields = ['order_number', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        """Filter orders by clinic/owner or role-based logic if needed."""
        # For now, list all accessible orders
        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return APIResponse.success(
                data={
                    'orders': serializer.data,
                    'count': self.paginator.page.paginator.count,
                    'next': self.paginator.get_next_link(),
                    'previous': self.paginator.get_previous_link()
                },
                message="Orders retrieved successfully"
            )

        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data={'orders': serializer.data, 'count': queryset.count()},
            message="Orders retrieved successfully"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message=f"Order {instance.order_number} details"
        )

    def create(self, request, *args, **kwargs):
        # Automatically set the session if not provided (get latest open session for cashier)
        data = request.data.copy()
        if not data.get('session'):
            current_session = POSSession.objects.filter(
                cashier=request.user, 
                status=POSSession.Status.OPEN
            ).first()
            if not current_session:
                return APIResponse.error(
                    message="You must have an active session to create an order.",
                    error_code="NO_ACTIVE_SESSION"
                )
            data['session'] = current_session.id
            
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                error_code="VALIDATION_ERROR"
            )
        self.perform_create(serializer)
        logger.info(f"Order created: {serializer.data.get('order_number')} at table {serializer.data.get('table_number')} by user {request.user}")
        
        # NOTE: Usually orders are drafted first, so we might not want to notify kitchen yet.
        # But if the requirement says "when order create", we can verify.
        # Typically notification happens on 'send_to_kitchen'.
        # I will add it here just in case, or skipping if status is DRAFT.
        
        return APIResponse.created(
            data=serializer.data,
            message="Order created successfully"
        )

    @action(detail=True, methods=['post'], url_path='lines')
    def add_line(self, request, pk=None):
        """
        POST /api/orders/{id}/lines/
        Add item to order.
        """
        order = self.get_object()
        if order.status != Order.Status.DRAFT:
            return APIResponse.error(
                message="Cannot add items to a non-draft order.",
                error_code="ORDER_NOT_DRAFT"
            )
            
        serializer = OrderLineSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                error_code="VALIDATION_ERROR"
            )
            
        serializer.save(order=order)
        return APIResponse.success(
            data=serializer.data,
            message="Item added to order"
        )

    @action(detail=True, methods=['patch', 'delete'], url_path='lines/(?P<line_id>[^/.]+)')
    def manage_line(self, request, pk=None, line_id=None):
        """
        PATCH/DELETE /api/orders/{id}/lines/{line_id}/
        Update or remove order line.
        """
        order = self.get_object()
        try:
            line = OrderLine.objects.get(pk=line_id, order=order)
        except OrderLine.DoesNotExist:
            return APIResponse.not_found("Order line not found.")
            
        if request.method == 'DELETE':
            line.delete()
            order.calculate_totals()
            return APIResponse.success(message="Item removed from order")
            
        # PATCH
        serializer = OrderLineSerializer(line, data=request.data, partial=True)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                error_code="VALIDATION_ERROR"
            )
            
        serializer.save()
        return APIResponse.success(
            data=serializer.data,
            message="Order line updated"
        )

    @action(detail=True, methods=['post'], url_path='send-to-kitchen')
    def send_to_kitchen(self, request, pk=None):
        """
        POST /api/orders/{id}/send-to-kitchen/
        """
        order = self.get_object()
        if order.status != Order.Status.DRAFT:
            return APIResponse.error(
                message="Order is already sent or completed.",
                error_code="INVALID_STATUS"
            )
            
        if not order.lines.count():
            return APIResponse.error(
                message="Order has no items.",
                error_code="EMPTY_ORDER"
            )
            
        order.status = Order.Status.SENT_TO_KITCHEN
        order.save()
        
        logger.info(f"Order {order.order_number} sent to kitchen by user {request.user}")
        
        # Trigger WebSocket notification
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        from .serializers import OrderSerializer
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "kitchen_orders",
            {
                "type": "order.update",
                "message": {
                    "action": "create", # Treat sending to kitchen as 'create' for the kitchen view
                    "order": OrderSerializer(order).data
                }
            }
        )
        
        return APIResponse.success(
            data={'status': order.status, 'sent_at': timezone.now()},
            message="Order sent to kitchen"
        )

    @action(detail=True, methods=['post'], url_path='payments')
    def process_payments(self, request, pk=None):
        """
        POST /api/orders/{id}/payments/
        Process payment for an order.
        """
        from apps.payments.models import Payment, PaymentMethod, Receipt
        from apps.payments.serializers import PaymentSerializer
        
        order = self.get_object()
        payments_data = request.data.get('payments', [])
        
        if not payments_data:
            return APIResponse.error(message="No payment data provided.")
            
        results = []
        total_paid_in_request = 0
        
        for p_data in payments_data:
            method_id = p_data.get('payment_method_id')
            amount = p_data.get('amount')
            
            try:
                method = PaymentMethod.objects.get(pk=method_id)
            except PaymentMethod.DoesNotExist:
                return APIResponse.error(message=f"Payment method {method_id} not found.")
                
            payment = Payment.objects.create(
                order=order,
                payment_method=method,
                amount=amount,
                cashier_upi=order.session.cashier.upi_id if order.session and order.session.cashier else '',
                status=Payment.Status.COMPLETED
            )
            total_paid_in_request += amount
            results.append(PaymentSerializer(payment).data)
            
        # Create receipt if fully paid
        order.refresh_from_db()
        receipt_id = None
        if order.status == Order.Status.COMPLETED:
            receipt, created = Receipt.objects.get_or_create(order=order)
            receipt_id = receipt.id
            logger.info(f"Order {order.order_number} fully paid and completed. Receipt ID: {receipt_id}")
            
        return APIResponse.success(
            data={
                'order_id': order.id,
                'total_paid': total_paid_in_request,
                'receipt_id': receipt_id,
                'status': order.status,
                'payments': results
            },
            message="Payment processed successfully"
        )


class QROrderView(views.APIView):
    """
    POST /api/orders/qr/
    Public endpoint for customers to place orders via QR scan.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.tables.models import Table
        
        table_token = request.data.get('table_token')
        if not table_token:
            return APIResponse.error(message="Table token is required.")
            
        try:
            table = Table.objects.get(token=table_token)
        except Table.DoesNotExist:
            return APIResponse.error(message="Invalid table token.")
            
        # Find any active session to associate this order with
        # In a real scenario, we might need a more specific session logic (per floor/owner)
        # For now, we take the most recent open session overall or for a specific cashier
        current_session = POSSession.objects.filter(status=POSSession.Status.OPEN).first()
        
        if not current_session:
            return APIResponse.error(message="Ordering is currently unavailable (no active session).")
            
        data = request.data.copy()
        data['table'] = table.id
        data['session'] = current_session.id
        data['order_type'] = 'dine_in'
        data['status'] = Order.Status.SENT_TO_KITCHEN # Auto-send kitchen for QR
        
        serializer = OrderSerializer(data=data)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors
            )
            
        order = serializer.save()
        
        # Trigger WebSocket notification for Kitchen
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "kitchen_orders",
            {
                "type": "order.update",
                "message": {
                    "action": "create",
                    "order": OrderSerializer(order).data
                }
            }
        )
        
        return APIResponse.created(
            data=OrderSerializer(order).data,
            message="Order placed successfully via QR!"
        )


