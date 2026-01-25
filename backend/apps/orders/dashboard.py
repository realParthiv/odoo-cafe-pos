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
    
    def _get_sales_trend(self, period='daily'):
        """Generate sales trend data based on period (hourly, daily, monthly, yearly)"""
        from datetime import datetime
        
        # Get all non-cancelled orders
        all_orders = Order.objects.exclude(status=Order.Status.CANCELLED).values('created_at', 'total_amount')
        
        if period == 'hourly':
            # Last 24 hours (current hour + 23 previous hours)
            current_hour = timezone.localtime(timezone.now()).replace(minute=0, second=0, microsecond=0)
            start_time = current_hour - timedelta(hours=23)
            sales_data = {}
            
            for order in all_orders:
                order_time = timezone.localtime(order['created_at'])
                if order_time >= start_time:
                    hour_key = order_time.strftime('%Y-%m-%d %H:00')
                    if hour_key not in sales_data:
                        sales_data[hour_key] = {'total': 0, 'count': 0}
                    sales_data[hour_key]['total'] += float(order['total_amount'])
                    sales_data[hour_key]['count'] += 1
            
            # Fill all 24 hours (from 23 hours ago to current hour)
            sales_trend = []
            for i in range(24):
                hour = start_time + timedelta(hours=i)
                hour_key = hour.strftime('%Y-%m-%d %H:00')
                data = sales_data.get(hour_key, {'total': 0, 'count': 0})
                sales_trend.append({
                    'date': hour.strftime('%H:00'),
                    'sales': float(data['total']),
                    'orders': data['count']
                })
                
        elif period == 'monthly':
            # Last 12 months (current month + 11 previous months)
            from datetime import datetime
            sales_data = {}
            current_date = timezone.localtime(timezone.now()).date()
            current_month = current_date.replace(day=1)
            
            # Calculate 11 months ago
            year = current_month.year
            month = current_month.month - 11
            while month <= 0:
                month += 12
                year -= 1
            start_month = current_month.replace(year=year, month=month)
            
            for order in all_orders:
                order_date = timezone.localtime(order['created_at']).date()
                if order_date >= start_month:
                    month_key = order_date.strftime('%Y-%m')
                    if month_key not in sales_data:
                        sales_data[month_key] = {'total': 0, 'count': 0}
                    sales_data[month_key]['total'] += float(order['total_amount'])
                    sales_data[month_key]['count'] += 1
            
            # Fill all 12 months (from 11 months ago to current month)
            sales_trend = []
            for i in range(12):
                # Calculate month by adding i months to start_month
                target_year = start_month.year
                target_month = start_month.month + i
                while target_month > 12:
                    target_month -= 12
                    target_year += 1
                month = start_month.replace(year=target_year, month=target_month)
                month_key = month.strftime('%Y-%m')
                data = sales_data.get(month_key, {'total': 0, 'count': 0})
                sales_trend.append({
                    'date': month.strftime('%b %Y'),
                    'sales': float(data['total']),
                    'orders': data['count']
                })
                
        elif period == 'yearly':
            # Last 5 years
            sales_data = {}
            current_year = timezone.now().year
            start_year = current_year - 4
            
            for order in all_orders:
                order_year = timezone.localtime(order['created_at']).year
                if order_year >= start_year:
                    if order_year not in sales_data:
                        sales_data[order_year] = {'total': 0, 'count': 0}
                    sales_data[order_year]['total'] += float(order['total_amount'])
                    sales_data[order_year]['count'] += 1
            
            # Fill all 5 years
            sales_trend = []
            for i in range(5):
                year = start_year + i
                data = sales_data.get(year, {'total': 0, 'count': 0})
                sales_trend.append({
                    'date': str(year),
                    'sales': float(data['total']),
                    'orders': data['count']
                })
                
        else:  # daily (default)
            # Last 7 days
            seven_days_ago = timezone.now().date() - timedelta(days=6)
            daily_totals = {}
            
            for order in all_orders:
                order_date = timezone.localtime(order['created_at']).date()
                if order_date >= seven_days_ago:
                    if order_date not in daily_totals:
                        daily_totals[order_date] = {'total': 0, 'count': 0}
                    daily_totals[order_date]['total'] += float(order['total_amount'])
                    daily_totals[order_date]['count'] += 1
            
            sales_trend = []
            for i in range(7):
                day = seven_days_ago + timedelta(days=i)
                day_data = daily_totals.get(day, {'total': 0, 'count': 0})
                sales_trend.append({
                    'date': day.isoformat(),
                    'sales': float(day_data['total']),
                    'orders': day_data['count']
                })
        
        return sales_trend

    def get(self, request):
        from apps.sessions.models import POSSession
        
        period = request.query_params.get('period', 'daily')
        
        try:
            # Show ALL orders (including open sessions) for real-time stats
            # 1. Overall Stats
            total_sales = Order.objects.exclude(
                status=Order.Status.CANCELLED
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            total_orders = Order.objects.exclude(status=Order.Status.CANCELLED).count()
            completed_orders = Order.objects.filter(status=Order.Status.COMPLETED).count()
            avg_order_value = total_sales / total_orders if total_orders > 0 else 0

            # 2. Category Breakdown (for Pie Chart)
            category_stats = Category.objects.filter(is_active=True).annotate(
                sales=Sum('products__orderline__total_price', filter=~models.Q(products__orderline__order__status=Order.Status.CANCELLED)),
                order_count=Count('products__orderline__order', distinct=True, filter=~models.Q(products__orderline__order__status=Order.Status.CANCELLED))
            ).values('name', 'color', 'sales', 'order_count').order_by('-sales')

            # 3. Sales Trend based on period
            sales_trend = self._get_sales_trend(period)

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
        period = request.query_params.get('period', 'daily')
        
        # Use the same _get_sales_trend method from DashboardStatsView
        stats_view = DashboardStatsView()
        sales_data = stats_view._get_sales_trend(period)

        return APIResponse.success(
            data={'history': sales_data},
            message="Sales history retrieved successfully"
        )

class CashierPerformanceView(APIView):
    """
    GET /api/orders/dashboard/cashier-performance/
    Sales and order data grouped by cashier.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.sessions.models import POSSession
        from django.db.models import DurationField, ExpressionWrapper
        
        # Show all orders (including open sessions) for real-time performance tracking
        cashiers = User.objects.filter(role='cashier').annotate(
            total_sales=Sum('pos_sessions__orders__total_amount', filter=~models.Q(pos_sessions__orders__status=Order.Status.CANCELLED)),
            total_orders=Count('pos_sessions__orders', filter=~models.Q(pos_sessions__orders__status=Order.Status.CANCELLED)),
            sessions_count=Count('pos_sessions', distinct=True)
        ).values(
            'id', 'first_name', 'last_name', 'email', 'total_sales', 'total_orders', 'sessions_count'
        ).order_by('-total_sales')

        # Get detailed session info for each cashier
        performance_list = []
        for cashier_data in cashiers:
            cashier_id = cashier_data['id']
            
            # Get ALL sessions (not just closed) with details
            sessions = POSSession.objects.filter(cashier_id=cashier_id).annotate(
                duration=ExpressionWrapper(
                    F('end_time') - F('start_time'),
                    output_field=DurationField()
                )
            ).values(
                'id', 'start_time', 'end_time', 'status', 'starting_cash', 'closing_cash', 'duration'
            ).order_by('-start_time')
            
            sessions_list = []
            total_duration_seconds = 0
            
            for session in sessions:
                session_info = {
                    'id': session['id'],
                    'start_time': session['start_time'],
                    'end_time': session['end_time'],
                    'status': session['status'],
                    'starting_cash': float(session['starting_cash']) if session['starting_cash'] else 0,
                    'closing_cash': float(session['closing_cash']) if session['closing_cash'] else 0,
                }
                
                # Calculate session duration
                if session['duration']:
                    duration_seconds = session['duration'].total_seconds()
                    session_info['duration_hours'] = round(duration_seconds / 3600, 2)
                    total_duration_seconds += duration_seconds
                elif session['status'] == 'open':
                    # For open sessions, calculate duration from now
                    if session['start_time']:
                        current_duration = timezone.now() - session['start_time']
                        session_info['duration_hours'] = round(current_duration.total_seconds() / 3600, 2)
                else:
                    session_info['duration_hours'] = None
                    
                sessions_list.append(session_info)
            
            # Build cashier performance data
            cashier_performance = {
                'id': cashier_data['id'],
                'first_name': cashier_data['first_name'],
                'last_name': cashier_data['last_name'],
                'email': cashier_data['email'],
                'total_sales': float(cashier_data['total_sales']) if cashier_data['total_sales'] else 0,
                'total_orders': cashier_data['total_orders'] or 0,
                'sessions_count': cashier_data['sessions_count'] or 0,
                'avg_per_order': float(cashier_data['total_sales'] / cashier_data['total_orders']) if cashier_data['total_orders'] and cashier_data['total_sales'] else 0,
                'total_hours_worked': round(total_duration_seconds / 3600, 2) if total_duration_seconds else 0,
                'sessions': sessions_list
            }
            
            performance_list.append(cashier_performance)

        return APIResponse.success(
            data={'cashiers': performance_list},
            message="Cashier performance data retrieved successfully"
        )
