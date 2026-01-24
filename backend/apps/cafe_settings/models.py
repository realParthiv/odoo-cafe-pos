from django.db import models

class CafeSettings(models.Model):
    """
    General settings for the cafe and mobile ordering.
    """
    class OrderType(models.TextChoices):
        ONLINE = 'online', 'Online'
        QR_MENU = 'qr_menu', 'QR Menu Only'

    id = models.BigAutoField(primary_key=True)
    
    # Cafe info
    name = models.CharField(max_length=100, default="Our Cafe")
    
    # Mobile Order Settings
    self_ordering_enabled = models.BooleanField(default=True)
    order_type = models.CharField(
        max_length=20, 
        choices=OrderType.choices, 
        default=OrderType.ONLINE
    )
    background_color = models.CharField(max_length=20, default="#FFFFFF")
    payment_at_counter = models.BooleanField(default=True)
    
    # QR/Frontend Settings
    frontend_url = models.URLField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Base URL for QR codes (e.g., https://your-ngrok.app)"
    )
    
    # Generic logo/image fields could go here or in a separate model
    
    class Meta:
        verbose_name = "Cafe Settings"
        verbose_name_plural = "Cafe Settings"

    def __str__(self):
        return self.name

class CafeImage(models.Model):
    """
    Store uploaded images for cafe branding (logos, backgrounds).
    """
    id = models.BigAutoField(primary_key=True)
    image = models.ImageField(upload_to='cafe/branding/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id}"
