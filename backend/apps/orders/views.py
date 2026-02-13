from rest_framework import viewsets, status, permissions, views, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
import logging
import uuid

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
    lookup_field = 'id'  # Changed from 'uuid' to 'id' to accept numeric IDs from frontend
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'order_type', 'session', 'table']
    search_fields = ['order_number', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        """
        Filter policies:
        - Admins: See all orders.
        - Cashiers: See only orders from their own sessions.
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.is_authenticated and user.role == 'cashier':
            return queryset.filter(session__cashier=user)
            
        return queryset

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
    def add_line(self, request, id=None):
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
        
        print(f"🔵 ADD_LINE - Order {order.order_number} current totals: sub={order.subtotal}, tax={order.tax_amount}, total={order.total_amount}")
        print(f"🔵 ADD_LINE - Incoming data: {request.data}")
            
        serializer = OrderLineSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"❌ ADD_LINE - Validation failed: {serializer.errors}")
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                error_code="VALIDATION_ERROR"
            )
        
        # Save the line
        line = serializer.save(order=order)
        
        # Refresh order and line to see updated values
        order.refresh_from_db()
        line.refresh_from_db()
        
        print(f"✅ ADD_LINE - Line created: id={line.id}, product={line.product.name}, qty={line.quantity}")
        print(f"   - unit_price: {line.unit_price}")
        print(f"   - tax_rate: {line.tax_rate}")
        print(f"   - total_price: {line.total_price}")
        print(f"   - tax_amount: {line.tax_amount}")
        print(f"✅ ADD_LINE - Order {order.order_number} NEW totals: sub={order.subtotal}, tax={order.tax_amount}, total={order.total_amount}")
            
        return APIResponse.success(
            data=serializer.data,
            message="Item added to order"
        )

    @action(detail=True, methods=['patch', 'delete'], url_path='lines/(?P<line_id>[^/.]+)')
    def manage_line(self, request, id=None, line_id=None):
        """ra
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
    def send_to_kitchen(self, request, id=None):
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

    @action(detail=True, methods=['post'], url_path='close')
    def close_order(self, request, id=None):
        """
        POST /api/orders/{id}/close/
        Close order and unoccupy the table.
        This is called after meal is complete and table should be freed up.
        """
        from apps.tables.models import Table
        
        order = self.get_object()
        
        # Mark order as completed
        order.status = Order.Status.COMPLETED
        order.save()
        
        # Unoccupy the table
        if order.table:
            order.table.status = Table.Status.AVAILABLE
            order.table.save()
            logger.info(f"Table {order.table.table_number} marked as AVAILABLE after order {order.order_number}")
        
        logger.info(f"Order {order.order_number} closed and table unoccupied by user {request.user}")
        
        return APIResponse.success(
            data={
                'order_id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'table_status': order.table.status if order.table else None
            },
            message="Order closed and table freed up"
        )

    @action(detail=True, methods=['get'], url_path='payment-qr')
    def get_payment_qr(self, request, id=None):
        """
        GET /api/orders/{id}/payment-qr/
        Generate dynamic UPI QR code for order payment.
        """
        import qrcode
        from io import BytesIO
        from django.http import HttpResponse
        
        order = self.get_object()
        
        # 1. Ensure totals are up-to-date and positive
        order.calculate_totals()
        order.refresh_from_db()
        
        amount = order.total_amount
        if amount <= 0:
            return APIResponse.error(
                message="Order total is zero or invalid.",
                error_code="INVALID_AMOUNT"
            )
            
        # 2. Get Cashier's UPI ID
        cashier = order.session.cashier
        upi_id = cashier.upi_id if cashier and cashier.upi_id else None
        
        if not upi_id:
            # Fallback for dev/testing or return error
            # For strict money handling, we should error if no UPI ID is configured
            return APIResponse.error(
                message="Cashier does not have a configured UPI ID.",
                error_code="NO_UPI_ID"
            )
            
        cashier_name = cashier.get_full_name() or "Cafe POS"
        order_ref = f"Order-{order.order_number}"
        
        # 3. Construct UPI URL
        # Format: upi://pay?pa={upi_id}&pn={name}&am={amount}&tn={note}&cu=INR
        upi_url = f"upi://pay?pa={upi_id}&pn={cashier_name}&am={amount}&tn={order_ref}&cu=INR"
        
        # 4. Generate QR Image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(upi_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return HttpResponse(buffer.read(), content_type="image/png")

    @action(detail=True, methods=['post'], url_path='payments')
    def process_payments(self, request, id=None):
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


class QRInfoView(views.APIView):
    """
    GET /api/orders/qr/info/?table_token=...
    Privacy: AllowAny.
    Validate table token and check for active floor session.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.tables.models import Table
        from apps.sessions.models import POSSession
        
        table_token = request.query_params.get('table_token')
        if not table_token:
            return APIResponse.error(message="Table token is required.", error_code="TOKEN_REQUIRED")
            
        try:
            table = Table.objects.select_related('floor').get(token=table_token)
        except Table.DoesNotExist:
            return APIResponse.error(message="Invalid table token.", error_code="INVALID_TOKEN")
            
        # Check if any active session exists on this floor
        active_session = POSSession.objects.filter(
            status=POSSession.Status.OPEN,
            floor=table.floor
        ).first()
        
        if not active_session:
            return APIResponse.error(
                message="Self-ordering is currently unavailable for this floor. Please contact staff.",
                error_code="ORDERING_UNAVAILABLE"
            )
            
        return APIResponse.success(
            data={
                "table_id": table.id,
                "table_number": table.table_number,
                "floor_name": table.floor.name if table.floor else None,
                "session_id": active_session.id
            },
            message="Table and session validated successfully."
        )

class QROrderView(views.APIView):
    """
    POST /api/orders/qr/
    Public endpoint for customers to place orders via QR scan.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.tables.models import Table

        request_id = str(uuid.uuid4())[:8]
        incoming_data = request.data
        logger.info(f"[QR_ORDER][{request_id}] Incoming payload: {incoming_data}")
        print(f"QR_ORDER {request_id} incoming: {incoming_data}")

        table_identifier = request.data.get('table_token') or request.data.get('table') or request.data.get('table_number')
        if not table_identifier:
            logger.warning(f"[QR_ORDER][{request_id}] Missing table_token/table identifier")
            print(f"QR_ORDER {request_id} missing table identifier")
            return APIResponse.error(message="Table identifier is required.")

        table = None
        # Normalize identifier to string for comparisons
        table_identifier_str = str(table_identifier).strip()

        # 1) Try token (canonical path)
        table = Table.objects.filter(token=table_identifier_str).first()
        if table:
            logger.info(f"[QR_ORDER][{request_id}] Table resolved by token: id={table.id}, number={table.table_number}, floor={getattr(table.floor, 'name', None)}")
        else:
            # 2) Try table_number for backward compatibility with frontend sending numeric/string table numbers
            table = Table.objects.filter(table_number=table_identifier_str).first()
            if table:
                logger.info(f"[QR_ORDER][{request_id}] Table resolved by table_number: id={table.id}, number={table.table_number}, floor={getattr(table.floor, 'name', None)}")
            else:
                # 3) Try primary key (id) if numeric was sent (e.g., 12 meaning pk=12)
                try:
                    table_pk = int(table_identifier_str)
                except ValueError:
                    table_pk = None

                if table_pk is not None:
                    table = Table.objects.filter(pk=table_pk).first()
                    if table:
                        logger.info(f"[QR_ORDER][{request_id}] Table resolved by pk: id={table.id}, number={table.table_number}, floor={getattr(table.floor, 'name', None)}")

                if not table:
                    logger.warning(f"[QR_ORDER][{request_id}] Invalid table reference: {table_identifier}")
                    print(f"QR_ORDER {request_id} invalid table identifier {table_identifier}")
                    return APIResponse.error(message="Invalid table reference.")

        # Find any active session to associate this order with
        # In a real scenario, we might need a more specific session logic (per floor/owner)
        # For now, we take the most recent open session overall or for a specific cashier
        current_session = POSSession.objects.filter(status=POSSession.Status.OPEN).first()

        if not current_session:
            logger.warning(f"[QR_ORDER][{request_id}] No active POS session found")
            print(f"QR_ORDER {request_id} no active session")
            return APIResponse.error(message="Ordering is currently unavailable (no active session).")

        data = request.data.copy()
        data['table'] = table.id
        data['session'] = current_session.id
        data['order_type'] = 'dine_in'
        data['status'] = Order.Status.DRAFT # Customers start as Draft

        serializer = OrderSerializer(data=data)
        if not serializer.is_valid():
            logger.error(f"[QR_ORDER][{request_id}] Validation failed: errors={serializer.errors} payload={data}")
            print(f"QR_ORDER {request_id} validation failed: {serializer.errors}")
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors
            )

        order = serializer.save()
        logger.info(f"[QR_ORDER][{request_id}] Order saved draft: order_number={order.order_number}, total={order.total_amount}")

        # Attach order lines from payload (nested lines are read-only in serializer, so handle here)
        lines_payload = request.data.get('lines', []) or []
        if not lines_payload:
            logger.warning(f"[QR_ORDER][{request_id}] No lines provided in payload; aborting")
            print(f"QR_ORDER {request_id} missing lines")
            return APIResponse.error(
                message="Order must contain at least one line item.",
                error_code="NO_LINES"
            )

        created_lines = []
        for idx, line in enumerate(lines_payload, start=1):
            product_id = line.get('product')
            variant_id = line.get('variant') or None
            qty = line.get('quantity', 1)
            notes = line.get('notes', '')

            if not product_id:
                logger.error(f"[QR_ORDER][{request_id}] Line {idx} missing product id: {line}")
                return APIResponse.error(
                    message=f"Line {idx} is missing product id.",
                    error_code="LINE_PRODUCT_REQUIRED"
                )

            try:
                qty_val = int(qty)
            except (TypeError, ValueError):
                qty_val = 0

            if qty_val <= 0:
                logger.error(f"[QR_ORDER][{request_id}] Line {idx} has invalid quantity: {qty}")
                return APIResponse.error(
                    message=f"Line {idx} has invalid quantity.",
                    error_code="LINE_QUANTITY_INVALID"
                )

            # Fetch product to get price and tax_rate
            from apps.menu.models import Product
            
            try:
                product = Product.objects.get(pk=product_id)
            except Product.DoesNotExist:
                logger.error(f"[QR_ORDER][{request_id}] Line {idx} product not found: {product_id}")
                return APIResponse.error(
                    message=f"Line {idx} references an invalid product.",
                    error_code="PRODUCT_NOT_FOUND"
                )

            # Create order line with explicit unit_price and tax_rate
            print(f"[QR_ORDER][{request_id}] BEFORE CREATE - Product: {product.name}, Price: {product.price}, Tax: {product.tax_rate}")
            
            created_line = OrderLine.objects.bulk_create(
                order=order,
                product=product,
                variant_id=variant_id,
                quantity=qty_val,
                unit_price=product.price,
                tax_rate=product.tax_rate,
                notes=notes,
            )
            
            # Refresh to get saved values
            created_line.refresh_from_db()
            print(f"[QR_ORDER][{request_id}] AFTER CREATE - Line ID: {created_line.id}")
            print(f"   - unit_price: {created_line.unit_price}")
            print(f"   - tax_rate: {created_line.tax_rate}")
            print(f"   - quantity: {created_line.quantity}")
            print(f"   - total_price: {created_line.total_price}")
            print(f"   - tax_amount: {created_line.tax_amount}")
            
            created_lines.append(created_line.id)
            logger.info(f"[QR_ORDER][{request_id}] Line {idx} created: product={product.name}, qty={qty_val}, price={product.price}, tax={product.tax_rate}")

        # Recalculate totals now that lines are added
        print(f"[QR_ORDER][{request_id}] BEFORE calculate_totals - Order totals: subtotal={order.subtotal}, tax={order.tax_amount}, total={order.total_amount}")
        
        order.calculate_totals()
        order.refresh_from_db()
        
        print(f"[QR_ORDER][{request_id}] AFTER calculate_totals - Order totals: subtotal={order.subtotal}, tax={order.tax_amount}, total={order.total_amount}")
        logger.info(f"[QR_ORDER][{request_id}] Lines created: {created_lines}; totals updated subtotal={order.subtotal} tax={order.tax_amount} total={order.total_amount}")

        # Razorpay Integration: Create Razorpay Order
        try:
            import razorpay
            from django.conf import settings

            # Validate Razorpay credentials exist
            razorpay_key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
            razorpay_key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')

            if not razorpay_key_id or not razorpay_key_secret:
                logger.error(f"[QR_ORDER][{request_id}] Razorpay credentials not configured")
                print(f"QR_ORDER {request_id} missing Razorpay creds")
                return APIResponse.created(
                    data=OrderSerializer(order).data,
                    message="Order created but payment gateway not configured. Please contact staff."
                )
                

            client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

            # Amount must be in paisa (100 paisa = 1 INR)
            razorpay_amount = int(order.total_amount * 100)

            if razorpay_amount <= 0:
                # Allow zero-amount orders to proceed without Razorpay; return draft
                logger.warning(f"[QR_ORDER][{request_id}] Zero/invalid amount for Razorpay: {order.total_amount}. Returning draft without payment session.")
                print(f"QR_ORDER {request_id} zero/invalid amount {order.total_amount}")
                return APIResponse.created(
                    data=OrderSerializer(order).data,
                    message="Order placed as draft. No payment required or amount is zero."
                )

            razorpay_order = client.order.create({
                "amount": razorpay_amount,
                "currency": "INR",
                "receipt": f"receipt_{order.order_number}",
                "payment_capture": 1  # Auto-capture
            })

            order.razorpay_order_id = razorpay_order['id']
            order.save(update_fields=['razorpay_order_id'])

            logger.info(f"[QR_ORDER][{request_id}] Razorpay order created: {razorpay_order['id']} for order {order.order_number}")
            print(f"QR_ORDER {request_id} razorpay order {razorpay_order['id']}")

            # Add razorpay details to response
            response_data = OrderSerializer(order).data
            response_data['razorpay_order_id'] = razorpay_order['id']
            response_data['razorpay_key'] = razorpay_key_id

            return APIResponse.created(
                data=response_data,
                message="Order placed successfully. Please proceed with payment."
            )

        except ImportError:
            logger.error(f"[QR_ORDER][{request_id}] Razorpay SDK not installed")
            print(f"QR_ORDER {request_id} razorpay sdk missing")
            return APIResponse.created(
                data=OrderSerializer(order).data,
                message="Order created but payment gateway unavailable. Please contact staff."
            )
        except razorpay.errors.BadRequestError as e:
            logger.error(f"[QR_ORDER][{request_id}] Razorpay bad request: {str(e)}")
            print(f"QR_ORDER {request_id} razorpay bad request {e}")
            # Treat auth/config issues as soft-fail: return draft without Razorpay session
            return APIResponse.created(
                data=OrderSerializer(order).data,
                message="Order placed, but payment gateway is unavailable. Please pay at counter."
            )
        except Exception as e:
            logger.error(f"[QR_ORDER][{request_id}] Razorpay order creation failed: {str(e)}", exc_info=True)
            print(f"QR_ORDER {request_id} razorpay exception {e}")
            # Order is saved as draft in our DB even if Razorpay fails
            return APIResponse.created(
                data=OrderSerializer(order).data,
                message="Order placed but payment initialization failed. Please contact staff."
            )


