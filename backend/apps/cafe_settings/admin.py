from django.contrib import admin
from .models import CafeSettings, CafeImage

@admin.register(CafeSettings)
class CafeSettingsAdmin(admin.ModelAdmin):
    list_display = ['name', 'self_ordering_enabled', 'order_type', 'frontend_url']
    
    def has_add_permission(self, request):
        # Only allow one settings object
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)

@admin.register(CafeImage)
class CafeImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'image', 'uploaded_at']
