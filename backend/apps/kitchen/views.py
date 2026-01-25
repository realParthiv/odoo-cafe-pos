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

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        PATCH /api/kitchen/orders/{id}/update-status/
        
        UNIFIED ENDPOINT: Update order line status (single line or all lines)
        
        For SINGLE LINE update:
        {
            "line_id": 5,
            "status": "preparing"
        }
        
        For ALL LINES update (whole order):
        {
            "status": "ready",
            "update_all": true
        }
        OR simply omit line_id:
        {
            "status": "ready"
        }
        """
        order = self.get_object()
        new_status = request.data.get('status')
        line_id = request.data.get('line_id')
        update_all = request.data.get('update_all', False)
        
        # Validation
        if not new_status:
            return APIResponse.error(
                message="Status is required",
                error_code="MISSING_STATUS"
            )
        
        if new_status not in OrderLine.Status.values:
            return APIResponse.error(
                message=f"Invalid status. Choices: {OrderLine.Status.values}",
                error_code="INVALID_STATUS"
            )
        
        # Determine if updating single line or all lines
        if line_id and not update_all:
            # SINGLE LINE UPDATE
            try:
                line = OrderLine.objects.get(pk=line_id, order=order)
            except OrderLine.DoesNotExist:
                return APIResponse.not_found("Order line not found in this order.")
            
            line.status = new_status
            line.save()
            
            # Refresh and get all lines
            order.refresh_from_db()
            all_lines = order.lines.all()
            all_ready = all(l.status in ['ready', 'served'] for l in all_lines)
            
            # Broadcast single line update
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "kitchen_orders",
                {
                    "type": "order.update",
                    "message": {
                        "action": "single_line_update",
                        "order_id": order.id,
                        "line_id": line.id,
                        "status": new_status,
                        "order": OrderSerializer(order).data 
                    }
                }
            )
            
            response_data = {
                "update_type": "single_line",
                "updated_line": OrderLineSerializer(line).data,
                "order": {
                    "id": order.id,
                    "order_number": order.order_number,
                    "table_number": order.table.table_number if order.table else None,
                    "table_capacity": order.table.capacity if order.table else None,
                    "customer_name": order.customer_name,
                    "customer_phone": order.customer_phone,
                    "order_type": order.order_type,
                    "status": order.status,
                    "total_amount": str(order.total_amount),
                    "created_at": order.created_at,
                    "notes": order.notes,
                },
                "all_lines": OrderLineSerializer(all_lines, many=True).data,
                "all_lines_ready": all_ready,
                "new_status": new_status,
            }
            
            return APIResponse.success(
                data=response_data,
                message=f"Line item #{line_id} marked as {new_status}"
            )
        
        else:
            # BULK UPDATE - ALL LINES
            all_lines = order.lines.all()
            updated_count = all_lines.update(status=new_status)
            
            # Refresh order
            order.refresh_from_db()
            all_lines = order.lines.all()
            
            # Broadcast bulk update
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "kitchen_orders",
                {
                    "type": "order.update",
                    "message": {
                        "action": "bulk_update",
                        "order_id": order.id,
                        "status": new_status,
                        "updated_count": updated_count,
                        "order": OrderSerializer(order).data 
                    }
                }
            )
            
            response_data = {
                "update_type": "all_lines",
                "order": {
                    "id": order.id,
                    "order_number": order.order_number,
                    "table_number": order.table.table_number if order.table else None,
                    "table_capacity": order.table.capacity if order.table else None,
                    "customer_name": order.customer_name,
                    "customer_phone": order.customer_phone,
                    "order_type": order.order_type,
                    "status": order.status,
                    "total_amount": str(order.total_amount),
                    "created_at": order.created_at,
                    "notes": order.notes,
                },
                "updated_lines_count": updated_count,
                "all_lines": OrderLineSerializer(all_lines, many=True).data,
                "new_status": new_status,
            }
            
            return APIResponse.success(
                data=response_data,
                message=f"All {updated_count} items marked as {new_status}"
            )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_order_status(self, request, pk=None):
        """
        PATCH /api/kitchen/orders/{id}/status/
        Update ALL order lines to the same status at once.
        
        Request body:
        {
            "status": "preparing" | "ready" | "served"
        }
        
        Response:
        {
            "success": true,
            "message": "All items marked as {status}",
            "data": {
                "order": {...},
                "updated_lines_count": 5,
                "all_lines": [...],
                "new_status": "ready"
            }
        }
        """
        order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return APIResponse.error(
                message="Status is required",
                error_code="MISSING_STATUS"
            )
        
        if new_status not in OrderLine.Status.values:
            return APIResponse.error(
                message=f"Invalid status. Choices: {OrderLine.Status.values}",
                error_code="INVALID_STATUS"
            )
        
        # Update all lines at once
        all_lines = order.lines.all()
        updated_count = all_lines.update(status=new_status)
        
        # Refresh order to get updated data
        order.refresh_from_db()
        all_lines = order.lines.all()  # Re-fetch updated lines
        
        # Broadcast update
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "kitchen_orders",
            {
                "type": "order.update",
                "message": {
                    "action": "bulk_update",
                    "order_id": order.id,
                    "status": new_status,
                    "order": OrderSerializer(order).data 
                }
            }
        )
        
        response_data = {
            "order": {
                "id": order.id,
                "order_number": order.order_number,
                "table_number": order.table.table_number if order.table else None,
                "table_capacity": order.table.capacity if order.table else None,
                "customer_name": order.customer_name,
                "customer_phone": order.customer_phone,
                "order_type": order.order_type,
                "status": order.status,
                "total_amount": str(order.total_amount),
                "created_at": order.created_at,
                "notes": order.notes,
            },
            "updated_lines_count": updated_count,
            "all_lines": OrderLineSerializer(all_lines, many=True).data,
            "new_status": new_status,
        }
        
        return APIResponse.success(
            data=response_data,
            message=f"All items marked as {new_status}"
        )
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_order(self, request, pk=None):
        """
        POST /api/kitchen/orders/{id}/complete/
        Mark entire order as COMPLETED and remove from kitchen queue.
        
        This will:
        1. Set all order lines to 'served' status
        2. Set order status to 'COMPLETED'
        3. Remove from kitchen display
        
        Response:
        {
            "success": true,
            "message": "Order completed successfully",
            "data": {
                "order": {...},
                "completed_at": "2026-01-25T10:30:00Z"
            }
        }
        """
        order = self.get_object()
        
        # Update all lines to served
        order.lines.all().update(status='served')
        
        # Mark order as completed
        order.status = Order.Status.COMPLETED
        order.save()
        
        # Broadcast completion
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "kitchen_orders",
            {
                "type": "order.complete",
                "message": {
                    "action": "complete",
                    "order_id": order.id,
                    "order": OrderSerializer(order).data 
                }
            }
        )
        
        response_data = {
            "order": OrderSerializer(order).data,
            "completed_at": order.updated_at,
        }
        
        return APIResponse.success(
            data=response_data,
            message="Order completed successfully"
        )
