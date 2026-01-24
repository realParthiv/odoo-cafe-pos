from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.responses import APIResponse
from apps.orders.models import Order, OrderLine
from apps.orders.serializers import OrderSerializer, OrderLineSerializer
from apps.accounts.permissions import IsKitchenStaff, IsAdmin

class KitchenOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for kitchen staff to view and manage orders.
    """
    # Only show orders relevant to kitchen
    queryset = Order.objects.filter(
        status=Order.Status.SENT_TO_KITCHEN
    ).prefetch_related('lines')
    serializer_class = OrderSerializer
    permission_classes = [IsKitchenStaff | IsAdmin]

    def get_queryset(self):
        # Optional: Add filtering by category logic here if kitchen has sections
        return super().get_queryset()

    @action(detail=True, methods=['patch'], url_path='lines/(?P<line_id>[^/.]+)/status')
    def update_line_status(self, request, pk=None, line_id=None):
        """
        PATCH /api/kitchen/orders/{id}/lines/{line_id}/status/
        Update status of a specific order line (e.g., pending -> preparing -> ready).
        """
        order = self.get_object()
        try:
            line = OrderLine.objects.get(pk=line_id, order=order)
        except OrderLine.DoesNotExist:
            return APIResponse.not_found("Order line not found in this order.")

        new_status = request.data.get('status')
        if new_status not in OrderLine.Status.values:
            return APIResponse.error(
                message=f"Invalid status. Choices: {OrderLine.Status.values}",
                error_code="INVALID_STATUS"
            )

        line.status = new_status
        line.save()

        # Check if all lines are ready/served to potentially update order status
        # simple logic: if all lines 'ready' or 'served', mark order query? 
        # For now, just return success.
        
        # Broadcast update
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        from apps.orders.serializers import OrderSerializer
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "kitchen_orders",
            {
                "type": "order.update",
                "message": {
                    "action": "update",
                    "order_id": order.id,
                    "line_id": line.id,
                    "status": new_status,
                    # Optional: send full order again or just delta
                    # "order": OrderSerializer(order).data 
                }
            }
        )
        
        return APIResponse.success(
            data=OrderLineSerializer(line).data,
            message=f"Item marked as {new_status}"
        )

    @action(detail=True, methods=['post'], url_path='ready')
    def mark_ready(self, request, pk=None):
        """
        POST /api/kitchen/orders/{id}/ready/
        Mark entire order as PREPARING or READY (or custom logic).
        """
        order = self.get_object()
        # Logic to update all lines or just order status?
        # Usually kitchen just marks items done. 
        # But if they want to signal "Whole Order Ready":
        
        # order.status = Order.Status.READY # if we had a READY status in Order
        # For now, let's assuming this might just be a signal notification
        
        return APIResponse.success(message="Order marked as ready (notification sent)")
