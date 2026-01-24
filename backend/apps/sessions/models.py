from django.db import models
from django.conf import settings
from django.utils import timezone

class POSSession(models.Model):
    """
    Tracks a cashier's session/shift.
    """
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'

    id = models.BigAutoField(primary_key=True)
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='pos_sessions'
    )
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    
    starting_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    closing_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.OPEN
    )
    
    notes = models.TextField(blank=True)
    
    # Aggregated data
    total_orders = models.IntegerField(default=0)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    session_number = models.CharField(max_length=50, unique=True, editable=False)

    class Meta:
        verbose_name = 'POS Session'
        verbose_name_plural = 'POS Sessions'
        ordering = ['-start_time']

    def __str__(self):
        return f"Session {self.session_number} - {self.cashier.email} ({self.status})"

    def update_totals(self):
        """Aggregate totals from all completed orders in this session."""
        completed_orders = self.orders.filter(status='completed')
        self.total_orders = completed_orders.count()
        self.total_sales = sum(o.total_amount for o in completed_orders)
        self.save()

    def save(self, *args, **kwargs):
        if not self.session_number:
            # Generate a simple session number if not present
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.session_number = f"SESS-{timestamp}-{self.cashier.id}"
        super().save(*args, **kwargs)
