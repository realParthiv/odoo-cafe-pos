from django.db import models
from django.conf import settings
from apps.menu.models import Product, ProductVariant
from apps.tables.models import Table
from apps.sessions.models import POSSession
from django.utils import timezone
import string
import random

class Order(models.Model):
    """
    Main Order model.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT_TO_KITCHEN = 'sent_to_kitchen', 'Sent to Kitchen'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class OrderType(models.TextChoices):
        DINE_IN = 'dine_in', 'Dine In'
        TAKEAWAY = 'takeaway', 'Takeaway'


    id = models.BigAutoField(primary_key=True)
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    
    session = models.ForeignKey(POSSession, on_delete=models.CASCADE, related_name='orders')
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    
    order_type = models.CharField(
        max_length=20, 
        choices=OrderType.choices, 
        default=OrderType.DINE_IN
    )
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.DRAFT
    )
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number: ORD-YYYYMMDD-XXXX
            date_str = timezone.now().strftime('%Y%m%d')
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            self.order_number = f"ORD-{date_str}-{random_str}"
        
        # When order is created for a table, status should change to occupied
        if self.table and self.status == self.Status.DRAFT:
            self.table.status = Table.Status.OCCUPIED
            self.table.save()
            
        super().save(*args, **kwargs)

    def calculate_totals(self):
        """Recalculate order totals from lines."""
        lines = self.lines.all()
        self.subtotal = sum(line.total_price for line in lines)
        self.tax_amount = sum(line.tax_amount for line in lines)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        self.save()


class OrderLine(models.Model):
    """
    Items within an order.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PREPARING = 'preparing', 'Preparing'
        READY = 'ready', 'Ready'

    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='lines')
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PENDING
    )
    
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    def save(self, *args, **kwargs):
        # Auto-fetch price/tax from product if not set or zero
        if not self.unit_price:
            self.unit_price = self.product.price
            
        if not self.tax_rate:
            self.tax_rate = self.product.tax_rate

        # Calculate total price and tax for this line
        self.total_price = self.unit_price * self.quantity
        self.tax_amount = (self.total_price * self.tax_rate) / 100
        super().save(*args, **kwargs)
        # Refresh order totals
        self.order.calculate_totals()
