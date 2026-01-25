from django.db import models
from django.conf import settings
from apps.menu.models import Product, ProductVariant
from apps.tables.models import Table
from apps.sessions.models import POSSession
from django.utils import timezone
from decimal import Decimal
import string
import random
import uuid

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
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, null=True, db_index=True)
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
    
    # Razorpay tracking
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    
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
        # Force fresh queryset from database
        self.refresh_from_db()
        lines = self.lines.all()
        
        print(f"🔧 CALCULATE_TOTALS - Order {self.order_number}")
        print(f"   - Lines count: {lines.count()}")
        for line in lines:
            print(f"   - Line {line.id}: {line.product.name} qty={line.quantity} unit_price={line.unit_price} total={line.total_price} tax={line.tax_amount}")
        
        subtotal = sum((line.total_price or Decimal('0')) for line in lines) or Decimal('0')
        tax = sum((line.tax_amount or Decimal('0')) for line in lines) or Decimal('0')
        discount = Decimal(self.discount_amount or 0)
        
        print(f"   - Calculated: subtotal={subtotal}, tax={tax}, discount={discount}, total={subtotal + tax - discount}")

        self.subtotal = subtotal
        self.tax_amount = tax
        self.total_amount = subtotal + tax - discount
        self.save(update_fields=['subtotal', 'tax_amount', 'total_amount'])
        print(f"   - Saved to DB: subtotal={self.subtotal}, tax={self.tax_amount}, total={self.total_amount}")



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
