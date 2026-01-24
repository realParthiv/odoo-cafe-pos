from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, dashboard

app_name = 'orders'

router = DefaultRouter()
router.register(r'', views.OrderViewSet)

urlpatterns = [
    path('qr/info/', views.QRInfoView.as_view(), name='qr_info'),
    path('qr/', views.QROrderView.as_view(), name='qr_order'),
    
    # Dashboard stats (Admin only)
    path('dashboard/stats/', dashboard.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/sales-history/', dashboard.SalesHistoryView.as_view(), name='sales_history'),
    path('dashboard/cashier-performance/', dashboard.CashierPerformanceView.as_view(), name='cashier_performance'),
    
    path('', include(router.urls)),
]
