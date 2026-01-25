"""
Serializers for tables app.
"""
from rest_framework import serializers
from .models import Floor, Table

class TableSerializer(serializers.ModelSerializer):
    """Serializer for Table model."""
    floor_name = serializers.CharField(source='floor.name', read_only=True)
    
    class Meta:
        model = Table
        fields = [
            'id', 'floor', 'floor_name', 'table_number', 'name', 
            'capacity', 'status', 'shape', 
            'x_position', 'y_position', 'width', 'height',
            'qr_code_url', 'token', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_code_url', 'token', 'created_at', 'updated_at']


class FloorSerializer(serializers.ModelSerializer):
    """Serializer for Floor model."""
    tables = TableSerializer(many=True, read_only=True)
    
    class Meta:
        model = Floor
        fields = [
            'id', 'name', 'number', 'is_active', 
            'tables', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
