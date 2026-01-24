"""
Views for tables app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.responses import APIResponse
from apps.accounts.permissions import IsAdmin, IsStaff
from .models import Floor, Table
from .serializers import FloorSerializer, TableSerializer

class FloorViewSet(viewsets.ModelViewSet):
    """
    CRUD for Floors.
    """
    queryset = Floor.objects.all().order_by('number')
    serializer_class = FloorSerializer
    permission_classes = [IsAdmin]  # Only admin can manage floors
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        self.perform_create(serializer)
        return APIResponse.created(
            data=serializer.data,
            message='Floor created successfully'
        )
    
    def update(self, request, *args, **kwargs):
        # Allow partial updates
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class TableViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tables.
    """
    queryset = Table.objects.all().order_by('table_number')
    serializer_class = TableSerializer
    permission_classes = [IsAdmin]  # Default to admin
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['floor', 'status', 'is_active']
    search_fields = ['table_number', 'name']

    def get_permissions(self):
        """Allow staff to view tables, but only admin to edit structure."""
        if self.action in ['list', 'retrieve', 'update_status']:
            return [IsStaff()]
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        self.perform_create(serializer)
        return APIResponse.created(
            data=serializer.data,
            message='Table created successfully'
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsStaff])
    def status(self, request, pk=None):
        """
        PATCH /api/tables/{id}/status/
        Update table status (Available, Occupied, etc.)
        """
        table = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in Table.Status.values:
            return APIResponse.error(
                message=f'Invalid status. Choices: {Table.Status.values}',
                error_code='INVALID_STATUS'
            )
        
        table.status = new_status
        table.save()
        
        return APIResponse.success(
            data=TableSerializer(table).data,
            message=f'Table marked as {new_status}'
        )
