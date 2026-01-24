from rest_framework import serializers
from .models import CafeSettings, CafeImage

class CafeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafeSettings
        fields = [
            'name', 'self_ordering_enabled', 'order_type', 
            'background_color', 'payment_at_counter', 'frontend_url'
        ]

class CafeImageSerializer(serializers.ModelSerializer):
    url = serializers.ImageField(source='image', read_only=True)
    
    class Meta:
        model = CafeImage
        fields = ['id', 'image', 'url', 'uploaded_at']
        extra_kwargs = {'image': {'write_only': True}}
