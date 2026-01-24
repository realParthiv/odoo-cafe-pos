"""
Models for Floor and Table management.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
import uuid

class Floor(models.Model):
    """
    Represents a physical floor or section in the cafe.
    e.g., 'Ground Floor', 'Patio', 'First Floor'
    """
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True, help_text=_("E.g., Ground Floor, Balcony"))
    number = models.IntegerField(default=0, help_text=_("Ordering for display"))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['number', 'name']
        verbose_name = _("Floor")
        verbose_name_plural = _("Floors")

    def __str__(self):
        return self.name


class Table(models.Model):
    """
    Represents a dining table.
    """
    class Status(models.TextChoices):
        AVAILABLE = 'available', _('Available')
        OCCUPIED = 'occupied', _('Occupied')
        RESERVED = 'reserved', _('Reserved')
        DIRTY = 'dirty', _('Dirty/Cleaning')

    class Shape(models.TextChoices):
        SQUARE = 'square', _('Square')
        CIRCLE = 'circle', _('Circle')
        RECTANGLE = 'rectangle', _('Rectangle')

    id = models.BigAutoField(primary_key=True)
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='tables', null=True, blank=True)
    
    table_number = models.CharField(max_length=20, unique=True, help_text=_("Unique Table Identifier, e.g., T-01"))
    name = models.CharField(max_length=50, blank=True, help_text=_("Friendly name, e.g., Window Seat"))
    
    capacity = models.PositiveIntegerField(
        default=2, 
        validators=[MinValueValidator(1)],
        help_text=_("Number of seats")
    )
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.AVAILABLE
    )
    
    shape = models.CharField(
        max_length=20,
        choices=Shape.choices,
        default=Shape.SQUARE,
        help_text=_("Shape for UI representation")
    )
    
    # UI coordinates (optional default)
    x_position = models.IntegerField(default=0)
    y_position = models.IntegerField(default=0)
    width = models.IntegerField(default=100)
    height = models.IntegerField(default=100)
    
    qr_code_url = models.URLField(blank=True, null=True)
    token = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['floor__number', 'table_number']
        verbose_name = _("Table")
        verbose_name_plural = _("Tables")

    def __str__(self):
        return f"{self.table_number} ({self.capacity} seats)"
