from django.urls import path
from . import views

app_name = 'cafe_settings'

urlpatterns = [
    path('mobile-order/', views.MobileOrderSettingsView.as_view(), name='mobile_order_settings'),
    path('upload-image/', views.ImageUploadView.as_view(), name='upload_image'),
]
