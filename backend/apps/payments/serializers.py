from rest_framework import serializers
from .models import PaymentMethod, Payment, Receipt

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'type', 'is_active']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'payment_method', 'amount', 'transaction_id', 'status', 'paid_at']

class ReceiptSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    cashier_name = serializers.CharField(source='order.session.cashier.get_full_name', read_only=True)
    subtotal = serializers.DecimalField(source='order.subtotal', max_digits=12, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(source='order.tax_amount', max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(source='order.total_amount', max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'order', 'order_number', 'receipt_number', 
            'issued_at', 'cashier_name', 'subtotal', 
            'tax_amount', 'total'
        ]
