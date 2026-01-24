from django.db import models
from apps.orders.models import Order
from django.utils import timezone

class PaymentMethod(models.Model):
    """
    Available payment methods (Cash, Card, UPI, etc.)
    """
    class MethodType(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        DIGITAL = 'digital', 'Digital (UPI/Wallet)'

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True, help_text='Unique code identifier (e.g., razorpay, cash, upi)')
    type = models.CharField(max_length=20, choices=MethodType.choices, default=MethodType.CASH)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.type})"

class Payment(models.Model):
    """
    Record of a payment for an order.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    cashier_upi = models.CharField(max_length=100, blank=True, help_text="UPI ID of the cashier who processed this")
    transaction_id = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="External payment gateway transaction ID (Razorpay payment_id, etc.)")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)
    
    paid_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Payment {self.id} for Order {self.order.order_number}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Check if order is fully paid
        self.check_order_payment_status()

    def check_order_payment_status(self):
        """Check if total payments >= order total_amount."""
        order = self.order
        total_paid = sum(p.amount for p in order.payments.filter(status=Payment.Status.COMPLETED))
        
        if total_paid >= order.total_amount:
            order.status = Order.Status.COMPLETED
            order.save()
            
            # Update session totals
            if order.session:
                order.session.update_totals()
            
            # When order is completed, mark table as available
            if order.table:
                order.table.status = 'available'
                order.table.save()

class Receipt(models.Model):
    """
    Tracking for issued receipts.
    """
    id = models.BigAutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.receipt_number

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = f"RCPT-{self.order.order_number}"
        super().save(*args, **kwargs)
