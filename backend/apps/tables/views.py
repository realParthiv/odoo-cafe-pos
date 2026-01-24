"""
Views for tables app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.responses import APIResponse
from apps.accounts.permissions import IsAdmin, IsStaff, IsAdminOrCashier
from .models import Floor, Table
from .serializers import FloorSerializer, TableSerializer
from apps.cafe_settings.models import CafeSettings
from apps.core.pdf_utils import generate_table_qr_pdf
from django.http import HttpResponse, FileResponse

class FloorViewSet(viewsets.ModelViewSet):
    """
    CRUD for Floors.
    """
    queryset = Floor.objects.all().order_by('number')
    serializer_class = FloorSerializer
    permission_classes = [IsAdminOrCashier]  # Admin and Cashier can manage floors
    search_fields = ['name']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data={'floors': serializer.data, 'count': queryset.count()},
            message="Floors retrieved successfully"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message=f"Floor {instance.name} details"
        )

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
    
    @action(detail=True, methods=['post'], url_path='tables/bulk')
    def bulk_tables(self, request, pk=None):
        """
        POST /api/tables/floors/{id}/tables/bulk/
        Bulk add/update/delete tables for a floor.
        """
        floor = self.get_object()
        tables_data = request.data.get('tables', [])
        deleted_ids = request.data.get('deleted_ids', [])
        
        # Handle deletions
        if deleted_ids:
            Table.objects.filter(id__in=deleted_ids, floor=floor).delete()
            
        # Handle add/updates
        for table_data in tables_data:
            table_id = table_data.get('id')
            if table_id:
                try:
                    table = Table.objects.get(id=table_id, floor=floor)
                    for attr, value in table_data.items():
                        if attr not in ['id', 'floor']:
                            setattr(table, attr, value)
                    table.save()
                except Table.DoesNotExist:
                    # Create if ID provided but not found? User said "Optional for new tables"
                    table_data['floor'] = floor
                    Table.objects.create(**table_data)
            else:
                # Create new
                table_data['floor'] = floor
                Table.objects.create(**table_data)
                
        return APIResponse.success(
            data=FloorSerializer(floor).data,
            message='Bulk table update successful'
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
        """Allow any staff to view, but only admin/cashier to edit structure."""
        if self.action in ['list', 'retrieve', 'update_status']:
            return [IsStaff()]
        return [IsAdminOrCashier()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return APIResponse.success(
                data={
                    'tables': serializer.data,
                    'count': self.paginator.page.paginator.count,
                    'next': self.paginator.get_next_link(),
                    'previous': self.paginator.get_previous_link()
                },
                message="Tables retrieved successfully"
            )

        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data={'tables': serializer.data, 'count': queryset.count()},
            message="Tables retrieved successfully"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message=f"Table {instance.table_number} details"
        )

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

    @action(detail=True, methods=['patch'], permission_classes=[IsStaff], url_path='status')
    def update_status(self, request, pk=None):
        """
        PATCH /api/tables/tables/{id}/status/
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

    @action(detail=True, methods=['get'], permission_classes=[IsStaff], url_path='qr')
    def get_qr(self, request, pk=None):
        """
        GET /api/tables/tables/{id}/qr/
        Generate and return QR code image for a table.
        """
        import qrcode
        from io import BytesIO
        from django.http import HttpResponse
        from django.conf import settings
        
        table = self.get_object()
        
        # Get dynamic frontend URL from settings
        settings_obj = CafeSettings.objects.filter(id=1).first()
        base_url = settings_obj.frontend_url if settings_obj and settings_obj.frontend_url else settings.FRONTEND_URL
        
        # Ensure base_url doesn't end with slash if we add one in path
        base_url = base_url.rstrip('/')
        
        # Frontend URL for ordering + table token
        order_url = f"{base_url}/order/{table.token}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(order_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save image to buffer
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return HttpResponse(buffer.read(), content_type="image/png")

    @action(detail=True, methods=['get'], permission_classes=[IsStaff], url_path='qr/pdf')
    def download_qr_pdf(self, request, pk=None):
        """
        GET /api/tables/tables/{id}/qr/pdf/
        Generate and return QR code as a printable PDF.
        """
        from django.conf import settings
        table = self.get_object()
        
        # Get dynamic frontend URL from settings
        settings_obj = CafeSettings.objects.filter(id=1).first()
        base_url = settings_obj.frontend_url if settings_obj and settings_obj.frontend_url else settings.FRONTEND_URL
        base_url = base_url.rstrip('/')
        
        order_url = f"{base_url}/order/{table.token}"
        cafe_name = settings_obj.name if settings_obj else "Our Cafe"
        
        pdf_buffer = generate_table_qr_pdf(
            table_number=table.table_number,
            qr_url=order_url,
            cafe_name=cafe_name
        )
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        filename = f"QR_{table.table_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response

