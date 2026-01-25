from rest_framework import serializers
from .models import Order, OrderLine

class OrderLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderLine
        fields = [
            'id', 'product', 'product_name', 'variant', 
            'quantity', 'unit_price', 'tax_rate', 
            'tax_amount', 'total_price', 'notes', 'status'
        ]
        read_only_fields = ['tax_amount', 'total_price', 'status', 'product_name']

class OrderSerializer(serializers.ModelSerializer):
    lines = OrderLineSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'uuid', 'order_number', 'session', 'table', 'table_number',
            'customer_name', 'customer_phone', 'order_type', 'status',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'notes', 'lines', 'created_at'
        ]
        read_only_fields = [
            'order_number', 'status', 'subtotal', 
            'tax_amount', 'total_amount', 'created_at'
        ]
