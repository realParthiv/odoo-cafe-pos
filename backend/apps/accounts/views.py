"""
Views for accounts app - Authentication and user management.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
import logging

from apps.core.responses import APIResponse
from .models import User
from .serializers import (
    UserSerializer,
    OwnerRegistrationSerializer,
    LoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    UpdateUPISerializer,
)
from .permissions import IsAdmin

logger = logging.getLogger(__name__)


class OwnerRegistrationView(APIView):
    """
    POST /api/auth/register/
    
    Register a new Admin/Owner account.
    Public endpoint - but should be restricted in production.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OwnerRegistrationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New owner registered: {user.email}")
        
        return APIResponse.created(
            data={
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            },
            message='Registration successful. Welcome to Café POS!'
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    
    Authenticate user and return JWT tokens.
    Also returns last session info and last sale for POS users.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Login failed',
                errors=serializer.errors,
                error_code='INVALID_CREDENTIALS'
            )
        
        user = serializer.validated_data['user']
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get last session info (will be implemented in sessions app)
        last_session_info = self._get_last_session_info(user)
        
        logger.info(f"User logged in: {user.email}")
        
        return APIResponse.success(
            data={
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'last_session': last_session_info,
            },
            message='Login successful'
        )
    
    def _get_last_session_info(self, user):
        """
        Get last POS session info for the user.
        Returns None if sessions app not yet implemented.
        """
        try:
            from apps.sessions.models import POSSession
            last_session = POSSession.objects.filter(
                user=user
            ).order_by('-opened_at').first()
            
            if last_session:
                last_order = last_session.orders.order_by('-created_at').first()
                return {
                    'session_number': last_session.session_number,
                    'status': last_session.status,
                    'opened_at': last_session.opened_at.isoformat(),
                    'closed_at': last_session.closed_at.isoformat() if last_session.closed_at else None,
                    'total_orders': last_session.total_orders,
                    'total_sales': str(last_session.total_sales),
                    'last_sale': {
                        'order_number': last_order.order_number,
                        'total_amount': str(last_order.total_amount),
                        'created_at': last_order.created_at.isoformat(),
                    } if last_order else None
                }
        except Exception:
            pass
        return None


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Logout user by blacklisting the refresh token.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logger.info(f"User logged out: {request.user.email}")
            
            return APIResponse.success(message='Logged out successfully')
        
        except TokenError:
            return APIResponse.error(
                message='Invalid token',
                error_code='INVALID_TOKEN'
            )


class TokenRefreshAPIView(TokenRefreshView):
    """
    POST /api/auth/token/refresh/
    
    Refresh access token using refresh token.
    """
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            return APIResponse.success(
                data={
                    'access': response.data.get('access'),
                    'refresh': response.data.get('refresh'),
                },
                message='Token refreshed successfully'
            )
        except TokenError as e:
            return APIResponse.error(
                message='Token refresh failed',
                errors={'detail': [str(e)]},
                error_code='TOKEN_REFRESH_FAILED',
                status_code=status.HTTP_401_UNAUTHORIZED
            )


class ProfileView(APIView):
    """
    GET /api/auth/profile/
    PATCH /api/auth/profile/
    
    Get or update current user's profile.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return APIResponse.success(
            data={'user': serializer.data},
            message='Profile retrieved successfully'
        )
    
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        
        serializer.save()
        
        return APIResponse.success(
            data={'user': serializer.data},
            message='Profile updated successfully'
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    
    Change current user's password.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        
        # Update password
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        logger.info(f"Password changed for user: {request.user.email}")
        
        return APIResponse.success(message='Password changed successfully')


class UpdateUPIView(APIView):
    """
    PATCH /api/auth/profile/upi/
    
    Update current user's UPI ID (for cashiers).
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        serializer = UpdateUPISerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        
        request.user.upi_id = serializer.validated_data.get('upi_id')
        request.user.save(update_fields=['upi_id'])
        
        return APIResponse.success(
            data={'upi_id': request.user.upi_id},
            message='UPI ID updated successfully'
        )


class UserListView(APIView):
    """
    GET /api/auth/users/
    
    List all users (Admin only).
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        users = User.objects.filter(is_active=True).order_by('-created_at')
        
        # Filter by role if provided
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        
        serializer = UserSerializer(users, many=True)
        
        return APIResponse.success(
            data={
                'users': serializer.data,
                'count': users.count()
            },
            message='Users retrieved successfully'
        )


class UserDetailView(APIView):
    """
    GET /api/auth/users/<id>/
    PATCH /api/auth/users/<id>/
    DELETE /api/auth/users/<id>/
    
    Manage individual user (Admin only).
    """
    permission_classes = [IsAdmin]
    
    def get_user(self, user_id):
        """Get user or return None."""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    def get(self, request, user_id):
        user = self.get_user(user_id)
        if not user:
            return APIResponse.not_found('User not found')
        
        serializer = UserSerializer(user)
        return APIResponse.success(
            data={'user': serializer.data}
        )
    
    def patch(self, request, user_id):
        user = self.get_user(user_id)
        if not user:
            return APIResponse.not_found('User not found')
        
        # Admins can update more fields
        allowed_fields = ['first_name', 'last_name', 'phone', 'upi_id', 'is_active']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        for field, value in update_data.items():
            setattr(user, field, value)
        user.save()
        
        serializer = UserSerializer(user)
        return APIResponse.success(
            data={'user': serializer.data},
            message='User updated successfully'
        )
    
    def delete(self, request, user_id):
        user = self.get_user(user_id)
        if not user:
            return APIResponse.not_found('User not found')
        
        # Prevent self-deletion
        if user.id == request.user.id:
            return APIResponse.error(
                message='Cannot delete your own account',
                error_code='SELF_DELETE_NOT_ALLOWED'
            )
        
        # Soft delete
        user.is_active = False
        user.save()
        
        logger.info(f"User deactivated by {request.user.email}: {user.email}")
        
        return APIResponse.success(message='User deactivated successfully')


# =============================================================================
# STAFF INVITATION VIEWS
# =============================================================================

from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import StaffInvitation
from .serializers import (
    StaffInvitationSerializer,
    StaffInvitationDetailSerializer,
    VerifyTokenSerializer,
    StaffSetPasswordSerializer,
)


class StaffInviteView(APIView):
    """
    POST /api/auth/staff/invite/
    
    Admin invites staff member. Sends email with token link.
    Token is valid for 7 days.
    """
    permission_classes = [IsAdmin]
    
    def post(self, request):
        serializer = StaffInvitationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        
        # Create invitation
        token = StaffInvitation.generate_token()
        expires_at = timezone.now() + timedelta(days=settings.STAFF_INVITATION_EXPIRY_DAYS)
        
        invitation = StaffInvitation.objects.create(
            email=serializer.validated_data['email'],
            token=token,
            role=serializer.validated_data['role'],
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            phone=serializer.validated_data.get('phone', ''),
            upi_id=serializer.validated_data.get('upi_id'),
            invited_by=request.user,
            expires_at=expires_at,
        )
        
        # Send invitation email
        self._send_invitation_email(invitation)
        
        logger.info(f"Staff invitation sent by {request.user.email} to {invitation.email}")
        
        return APIResponse.created(
            data={
                'invitation': StaffInvitationDetailSerializer(invitation).data
            },
            message=f'Invitation sent to {invitation.email}'
        )
    
    def _send_invitation_email(self, invitation):
        """Send invitation email with token link."""
        invite_url = f"{settings.FRONTEND_URL}/auth/set-password?token={invitation.token}"
        
        role_display = 'Cashier' if invitation.role == 'cashier' else 'Kitchen Staff'
        
        subject = f"You're invited to join Café POS as {role_display}"
        message = f"""
Hello{' ' + invitation.first_name if invitation.first_name else ''},

You have been invited to join Café POS as a {role_display}.

Click the link below to set up your password and activate your account:
{invite_url}

This link will expire in {settings.STAFF_INVITATION_EXPIRY_DAYS} days.

If you did not expect this invitation, please ignore this email.

Best regards,
Café POS Team
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitation.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send invitation email to {invitation.email}: {e}")
            # Don't raise - invitation is still created


class VerifyTokenView(APIView):
    """
    GET /api/auth/staff/verify-token/<token>/
    
    Verify if invitation token is valid.
    Public endpoint for staff to check before setting password.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        try:
            invitation = StaffInvitation.objects.get(token=token)
        except StaffInvitation.DoesNotExist:
            return APIResponse.error(
                message='Invalid invitation token',
                error_code='INVALID_TOKEN',
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if invitation.is_used:
            return APIResponse.error(
                message='This invitation has already been used',
                error_code='TOKEN_USED'
            )
        
        if invitation.is_expired:
            return APIResponse.error(
                message='This invitation has expired',
                error_code='TOKEN_EXPIRED'
            )
        
        # Return invitation details for pre-filling the form
        return APIResponse.success(
            data={
                'email': invitation.email,
                'role': invitation.role,
                'first_name': invitation.first_name,
                'last_name': invitation.last_name,
                'phone': invitation.phone,
                'expires_at': invitation.expires_at.isoformat(),
            },
            message='Token is valid'
        )


class StaffSetPasswordView(APIView):
    """
    POST /api/auth/staff/set-password/
    
    Staff sets password after clicking invitation link.
    Creates the user account and marks invitation as used.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = StaffSetPasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message='Validation failed',
                errors=serializer.errors,
                error_code='VALIDATION_ERROR'
            )
        
        # Create user account
        user = serializer.save()
        
        # Generate tokens for auto-login
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Staff account created: {user.email} ({user.role})")
        
        return APIResponse.created(
            data={
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            },
            message='Account created successfully. Welcome to Café POS!'
        )


class StaffInvitationListView(APIView):
    """
    GET /api/auth/staff/invitations/
    
    List all staff invitations (Admin only).
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        invitations = StaffInvitation.objects.all().order_by('-created_at')
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter == 'pending':
            invitations = invitations.filter(is_used=False)
        elif status_filter == 'used':
            invitations = invitations.filter(is_used=True)
        
        # Filter by role
        role = request.query_params.get('role')
        if role:
            invitations = invitations.filter(role=role)
        
        serializer = StaffInvitationDetailSerializer(invitations, many=True)
        
        return APIResponse.success(
            data={
                'invitations': serializer.data,
                'count': invitations.count()
            },
            message='Invitations retrieved successfully'
        )


class ResendInvitationView(APIView):
    """
    POST /api/auth/staff/invitations/<id>/resend/
    
    Resend invitation email (Admin only).
    """
    permission_classes = [IsAdmin]
    
    def post(self, request, invitation_id):
        try:
            invitation = StaffInvitation.objects.get(id=invitation_id)
        except StaffInvitation.DoesNotExist:
            return APIResponse.not_found('Invitation not found')
        
        if invitation.is_used:
            return APIResponse.error(
                message='This invitation has already been used',
                error_code='INVITATION_USED'
            )
        
        # Extend expiry and resend
        invitation.expires_at = timezone.now() + timedelta(days=settings.STAFF_INVITATION_EXPIRY_DAYS)
        invitation.save()
        
        # Resend email
        StaffInviteView()._send_invitation_email(invitation)
        
        logger.info(f"Invitation resent by {request.user.email} to {invitation.email}")
        
        return APIResponse.success(
            data={'invitation': StaffInvitationDetailSerializer(invitation).data},
            message=f'Invitation resent to {invitation.email}'
        )


class DeleteInvitationView(APIView):
    """
    DELETE /api/auth/staff/invitations/<id>/
    
    Delete/cancel an invitation (Admin only).
    """
    permission_classes = [IsAdmin]
    
    def delete(self, request, invitation_id):
        try:
            invitation = StaffInvitation.objects.get(id=invitation_id)
        except StaffInvitation.DoesNotExist:
            return APIResponse.not_found('Invitation not found')
        
        email = invitation.email
        invitation.delete()
        
        logger.info(f"Invitation deleted by {request.user.email} for {email}")
        
        return APIResponse.success(message=f'Invitation for {email} deleted')

