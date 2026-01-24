from rest_framework import views, status, permissions, parsers
from rest_framework.response import Response
from apps.core.responses import APIResponse
from .models import CafeSettings, CafeImage
from .serializers import CafeSettingsSerializer, CafeImageSerializer
from apps.accounts.permissions import IsAdmin

class MobileOrderSettingsView(views.APIView):
    """
    GET/PUT /api/settings/mobile-order
    Manage mobile ordering configuration.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, created = CafeSettings.objects.get_or_create(id=1)
        return obj

    def get(self, request):
        serializer = CafeSettingsSerializer(self.get_object())
        return APIResponse.success(data=serializer.data)

    def put(self, request):
        if not request.user.is_admin:
            return APIResponse.error(message="Only admins can update settings.", status_code=status.HTTP_403_FORBIDDEN)
            
        serializer = CafeSettingsSerializer(self.get_object(), data=request.data, partial=True)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors
            )
        serializer.save()
        return APIResponse.success(data=serializer.data, message="Settings updated")

class ImageUploadView(views.APIView):
    """
    POST /api/settings/upload-image
    Upload image for background/logo.
    """
    permission_classes = [IsAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        serializer = CafeImageSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Invalid image file")
            
        image_obj = serializer.save()
        return APIResponse.created(
            data=serializer.data,
            message="Image uploaded successfully"
        )
