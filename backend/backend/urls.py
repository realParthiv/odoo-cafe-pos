"""
URL configuration for backend project.
Café POS System - API Routes
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.accounts.urls', namespace='accounts')),
    path('api/sessions/', include('apps.sessions.urls', namespace='sessions')),
    path('api/menu/', include('apps.menu.urls', namespace='menu')),
    path('api/tables/', include('apps.tables.urls', namespace='tables')),
    path('api/orders/', include('apps.orders.urls', namespace='orders')),
    path('api/kitchen/', include('apps.kitchen.urls', namespace='kitchen')),
    path('api/payments/', include('apps.payments.urls', namespace='payments')),
    path('api/settings/', include('apps.cafe_settings.urls', namespace='cafe_settings')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
