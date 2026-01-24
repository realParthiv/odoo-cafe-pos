from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'payments'

router = DefaultRouter()
router.register(r'methods', views.PaymentMethodViewSet)
router.register(r'receipts', views.ReceiptViewSet)
router.register(r'payments', views.PaymentViewSet)

urlpatterns = [
    path('create-razorpay-order/', views.CreateRazorpayOrderView.as_view(), name='create_razorpay_order'),
    path('verify/', views.VerifyPaymentView.as_view(), name='payment_verify'),
    path('', include(router.urls)),
]
