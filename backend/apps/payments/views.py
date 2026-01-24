from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.responses import APIResponse
from .models import PaymentMethod, Payment, Receipt
from .serializers import PaymentMethodSerializer, PaymentSerializer, ReceiptSerializer
from apps.orders.models import Order

class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/payments/methods/
    List active payment methods.
    """
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='process-order/(?P<order_id>[^/.]+)')
    def process_order_payments(self, request, order_id=None):
        """
        POST /api/payments/process-order/{order_id}/
        Process payment for an order.
        Request: { "payments": [ { "payment_method_id": 1, "amount": 100 } ] }
        """
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return APIResponse.not_found("Order not found.")
            
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
                status=Payment.Status.COMPLETED
            )
            total_paid_in_request += amount
            results.append(PaymentSerializer(payment).data)
            
        # Create receipt if fully paid
        order.refresh_from_db()
        receipt = None
        if order.status == Order.Status.COMPLETED:
            receipt, created = Receipt.objects.get_or_create(order=order)
            
        return APIResponse.success(
            data={
                'order_id': order.id,
                'total_paid': total_paid_in_request,
                'receipt_id': receipt.id if receipt else None,
                'status': order.status,
                'payments': results
            },
            message="Payment processed successfully"
        )

class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/payments/receipts/{id}/
    """
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
