from rest_framework import serializers
from .models import POSSession

class POSSessionSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.get_full_name', read_only=True)
    
    class Meta:
        model = POSSession
        fields = [
            'id', 'session_number', 'cashier', 'cashier_name', 'floor',
            'start_time', 'end_time', 'starting_cash', 
            'closing_cash', 'status', 'notes'
        ]
        read_only_fields = ['id', 'session_number', 'cashier', 'start_time', 'end_time', 'status']

class POSSessionOpenSerializer(serializers.Serializer):
    starting_cash = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    floor_id = serializers.IntegerField(required=True, help_text="ID of the floor to assign")

class POSSessionCloseSerializer(serializers.Serializer):
    closing_cash = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
