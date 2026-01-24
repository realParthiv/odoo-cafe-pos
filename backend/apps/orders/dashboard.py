from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
import logging

from apps.core.responses import APIResponse
from apps.accounts.permissions import IsAdmin
from .models import Order, OrderLine
from apps.menu.models import Category
from apps.accounts.models import User

logger = logging.getLogger(__name__)

class DashboardStatsView(APIView):
    """
    GET /api/orders/dashboard/stats/
    Overall statistics for the owner dashboard.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            # 1. Overall Stats
            total_sales = Order.objects.filter(status=Order.Status.COMPLETED).aggregate(total=Sum('total_amount'))['total'] or 0
            total_orders = Order.objects.count()
            completed_orders = Order.objects.filter(status=Order.Status.COMPLETED).count()
            avg_order_value = total_sales / completed_orders if completed_orders > 0 else 0

            # 2. Category Breakdown (for Pie Chart)
            category_stats = Category.objects.filter(is_active=True).annotate(
                sales=Sum('products__orderline__total_price', filter=models.Q(products__orderline__order__status=Order.Status.COMPLETED)),
                order_count=Count('products__orderline__order', distinct=True, filter=models.Q(products__orderline__order__status=Order.Status.COMPLETED))
            ).values('name', 'color', 'sales', 'order_count').order_by('-sales')

            # 3. Daily Sales (Last 7 days for Bar/Line Chart)
            seven_days_ago = timezone.now().date() - timedelta(days=6)
            daily_sales = Order.objects.filter(
                status=Order.Status.COMPLETED,
                created_at__date__gte=seven_days_ago
            ).annotate(date=TruncDate('created_at')).values('date').annotate(
                total=Sum('total_amount'),
                count=Count('id')
            ).order_by('date')

            # Format daily sales to ensure all 7 days are present
            sales_trend = []
            for i in range(7):
                day = seven_days_ago + timedelta(days=i)
                day_data = next((item for item in daily_sales if item['date'] == day), None)
                sales_trend.append({
                    'date': day.isoformat(),
                    'total': float(day_data['total']) if day_data else 0,
                    'count': day_data['count'] if day_data else 0
                })

            return APIResponse.success(
                data={
                    'summary': {
                        'total_sales': float(total_sales),
                        'total_orders': total_orders,
                        'completed_orders': completed_orders,
                        'avg_order_value': float(avg_order_value),
                    },
                    'category_breakdown': list(category_stats),
                    'sales_trend': sales_trend
                },
                message="Dashboard statistics retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error generating dashboard stats: {str(e)}", exc_info=True)
            return APIResponse.error(message="Failed to generate dashboard statistics")

class SalesHistoryView(APIView):
    """
    GET /api/orders/dashboard/sales-history/
    Detailed history of sales for graph/table.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days-1)
        
        sales_data = Order.objects.filter(
            status=Order.Status.COMPLETED,
            created_at__date__gte=start_date
        ).annotate(date=TruncDate('created_at')).values('date').annotate(
            sales=Sum('total_amount'),
            orders=Count('id'),
            avg_value=Avg('total_amount')
        ).order_by('date')

        return APIResponse.success(
            data={'history': list(sales_data), 'period_days': days},
            message="Sales history retrieved successfully"
        )

class CashierPerformanceView(APIView):
    """
    GET /api/orders/dashboard/cashier-performance/
    Sales and order data grouped by cashier.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        # We look at orders grouped by the cashier tied to the session
        performance = User.objects.filter(role='cashier').annotate(
            total_sales=Sum('pos_sessions__orders__total_amount', filter=models.Q(pos_sessions__orders__status=Order.Status.COMPLETED)),
            total_orders=Count('pos_sessions__orders', filter=models.Q(pos_sessions__orders__status=Order.Status.COMPLETED)),
            sessions_count=Count('pos_sessions', distinct=True)
        ).values(
            'id', 'first_name', 'last_name', 'email', 'total_sales', 'total_orders', 'sessions_count'
        ).order_by('-total_sales')

        # Calculate average per session
        performance_list = list(performance)
        for p in performance_list:
            p['avg_per_order'] = float(p['total_sales'] / p['total_orders']) if p['total_orders'] and p['total_sales'] else 0
            p['total_sales'] = float(p['total_sales']) if p['total_sales'] else 0

        return APIResponse.success(
            data={'cashiers': performance_list},
            message="Cashier performance data retrieved successfully"
        )
