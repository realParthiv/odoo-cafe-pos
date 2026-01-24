from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.utils import timezone
from apps.core.responses import APIResponse
from .models import POSSession
from .serializers import POSSessionSerializer, POSSessionOpenSerializer, POSSessionCloseSerializer

class CurrentSessionView(views.APIView):
    """
    GET /api/sessions/current
    Get current active session for logged-in cashier.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session = POSSession.objects.filter(
            cashier=request.user, 
            status=POSSession.Status.OPEN
        ).first()
        
        if not session:
            return APIResponse.error(
                message="No active session found.",
                error_code="NO_ACTIVE_SESSION",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        serializer = POSSessionSerializer(session)
        return APIResponse.success(data=serializer.data)

class OpenSessionView(views.APIView):
    """
    POST /api/sessions/open
    Open a new cashier session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Check if user already has an open session
        existing_session = POSSession.objects.filter(
            cashier=request.user, 
            status=POSSession.Status.OPEN
        ).exists()
        
        if existing_session:
            return APIResponse.error(
                message="You already have an active session. Close it before opening a new one.",
                error_code="SESSION_ALREADY_OPEN"
            )
            
        serializer = POSSessionOpenSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                error_code="VALIDATION_ERROR"
            )
            
        floor_id = serializer.validated_data.get('floor_id')
        
        # Check if floor is already occupied by SOMEONE ELSE
        if floor_id:
            occupied_session = POSSession.objects.filter(
                floor_id=floor_id,
                status=POSSession.Status.OPEN
            ).exclude(cashier=request.user).first()
            
            if occupied_session:
                return APIResponse.error(
                    message=f"Floor is already occupied by {occupied_session.cashier.get_full_name() or occupied_session.cashier.email}.",
                    error_code="FLOOR_OCCUPIED"
                )

        session = POSSession.objects.create(
            cashier=request.user,
            starting_cash=serializer.validated_data['starting_cash'],
            floor_id=floor_id,
            status=POSSession.Status.OPEN
        )
        
        return APIResponse.created(
            data=POSSessionSerializer(session).data,
            message="Session opened successfully."
        )

class CloseSessionView(views.APIView):
    """
    POST /api/sessions/{id}/close
    Close a session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            session = POSSession.objects.get(pk=pk, cashier=request.user)
        except POSSession.DoesNotExist:
            return APIResponse.not_found("Session not found.")
            
        if session.status == POSSession.Status.CLOSED:
            return APIResponse.error(
                message="Session is already closed.",
                error_code="SESSION_ALREADY_CLOSED"
            )
            
        serializer = POSSessionCloseSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                error_code="VALIDATION_ERROR"
            )
            
        session.status = POSSession.Status.CLOSED
        session.closing_cash = serializer.validated_data['closing_cash']
        session.notes = serializer.validated_data.get('notes', '')
        session.end_time = timezone.now()
        session.save()
        
        return APIResponse.success(
            data=POSSessionSerializer(session).data,
            message="Session closed successfully."
        )

class LastSessionView(views.APIView):
    """
    GET /api/sessions/last
    Get last session summary for the cashier.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        last_session = POSSession.objects.filter(
            cashier=request.user
        ).order_by('-start_time').first()
        
        if not last_session:
            return APIResponse.error(
                message="No previous session found.",
                error_code="NO_SESSION_HISTORY",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        serializer = POSSessionSerializer(last_session)
        return APIResponse.success(data=serializer.data)

class SessionHistoryView(views.APIView):
    """
    GET /api/sessions/history
    Get session history for the logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = POSSession.objects.filter(cashier=request.user).order_by('-start_time')
        serializer = POSSessionSerializer(sessions, many=True)
        return APIResponse.success(data=serializer.data)

