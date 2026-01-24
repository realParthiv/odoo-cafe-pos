from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    """
    Product categories (e.g., Beverages, Snacks).
    """
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, default="#000000", help_text="Hex color code")
    sequence = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['sequence', 'name']

    def __str__(self):
        return self.name

class Product(models.Model):
    """
    Main product model.
    """
    class TaxRate(models.DecimalField):
        pass # Placeholder for custom logic if needed
        
    TAX_CHOICES = [
        (Decimal('5.00'), '5%'),
        (Decimal('12.00'), '12%'),
        (Decimal('18.00'), '18%'),
        (Decimal('28.00'), '28%'),
    ]

    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        choices=TAX_CHOICES, 
        default=5.00
    )
    uom = models.CharField(max_length=50, default="Unit", help_text="Unit of Measure (e.g., Unit, KG, Liter)")
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    has_variants = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None

    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    """
    Variants for a product (e.g., different sizes or packaging).
    """
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    attribute = models.CharField(max_length=100, help_text="e.g., Size, Pack")
    value = models.CharField(max_length=100, help_text="e.g., Small, Large, 6 pieces")
    unit = models.CharField(max_length=50, blank=True, help_text="e.g., KG, Liter")
    extra_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['attribute', 'value']

    def __str__(self):
        return f"{self.product.name} - {self.attribute}: {self.value}"
