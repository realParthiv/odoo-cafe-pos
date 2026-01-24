from rest_framework import serializers
from .models import Category, Product, ProductVariant

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'attribute', 'value', 'unit', 'extra_price', 'is_active']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'category_color', 
            'name', 'description', 'price', 'tax_rate', 
            'uom', 'image', 'image_url', 'has_variants', 'variants', 
            'is_active', 'created_at'
        ]

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        product = Product.objects.create(**validated_data)
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)
        return product

    def update(self, product, validated_data):
        variants_data = validated_data.pop('variants', None)
        
        # Update product fields
        for attr, value in validated_data.items():
            setattr(product, attr, value)
        product.save()

        if variants_data is not None:
            # Simple approach: delete and recreate variants for simplicity in this phased implementation
            # or handle by ID if user provided them. 
            # Looking at requirement: "_destroy" flag or separate endpoint.
            # I'll implement ID-based update.
            current_variants = {v.id: v for v in product.variants.all()}
            for variant_data in variants_data:
                variant_id = variant_data.get('id')
                if variant_id and variant_id in current_variants:
                    v = current_variants.pop(variant_id)
                    if variant_data.get('_destroy'):
                        v.delete()
                    else:
                        for v_attr, v_value in variant_data.items():
                            if v_attr not in ['id', '_destroy']:
                                setattr(v, v_attr, v_value)
                        v.save()
                elif not variant_data.get('_destroy'):
                    # Create new
                    ProductVariant.objects.create(product=product, **variant_data)
            
            # Deletion logic if not using _destroy specifically but omitted from list? 
            # User specifically mentioned _destroy flag.
            
        return product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'sequence', 'is_active']
