"""
Serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, StaffInvitation


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - read operations."""
    
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'upi_id', 'is_active', 'is_email_verified',
            'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'is_email_verified']


class OwnerRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for Owner/Admin registration.
    
    Only the first user or additional admins can register through this.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone'
        ]
    
    def validate_email(self, value):
        """Ensure email is unique and normalized."""
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email
    
    def validate_password(self, value):
        """Validate password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Ensure passwords match."""
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create a new owner/admin user."""
        validated_data.pop('confirm_password')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone'),
            role=User.Role.ADMIN,
            is_email_verified=True,  # Admin registration - auto verified
            is_staff=True,
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_email(self, value):
        """Normalize email."""
        return value.lower().strip()
    
    def validate(self, attrs):
        """Authenticate user."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError({
                    'detail': 'Invalid email or password.'
                })
            
            if not user.is_active:
                raise serializers.ValidationError({
                    'detail': 'Account is deactivated. Contact administrator.'
                })
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError({
            'detail': 'Email and password are required.'
        })


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile - update operations."""
    
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'upi_id', 'is_active', 'is_email_verified',
            'created_at', 'last_login'
        ]
        read_only_fields = [
            'id', 'email', 'role', 'created_at', 'last_login',
            'is_active', 'is_email_verified'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    current_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_new_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_current_password(self, value):
        """Validate current password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Ensure new passwords match."""
        if attrs.get('new_password') != attrs.get('confirm_new_password'):
            raise serializers.ValidationError({
                'confirm_new_password': 'New passwords do not match.'
            })
        return attrs


class UpdateUPISerializer(serializers.Serializer):
    """Serializer for updating UPI ID."""
    
    upi_id = serializers.CharField(
        max_length=100,
        allow_blank=True,
        allow_null=True
    )
    
    def validate_upi_id(self, value):
        """Basic UPI ID validation."""
        if value:
            value = value.strip()
            if '@' not in value:
                raise serializers.ValidationError(
                    'Invalid UPI ID format. Expected format: name@bank'
                )
        return value


class StaffInvitationSerializer(serializers.Serializer):
    """
    Serializer for Admin to invite staff.
    Sends email with token link valid for 7 days.
    """
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=[('cashier', 'Cashier'), ('kitchen', 'Kitchen Staff')]
    )
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=17, required=False, allow_blank=True)
    upi_id = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    
    def validate_email(self, value):
        """Ensure email is unique and not already invited."""
        email = value.lower().strip()
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        
        # Check for pending invitation
        pending = StaffInvitation.objects.filter(
            email=email,
            is_used=False
        ).first()
        
        if pending and pending.is_valid:
            raise serializers.ValidationError(
                'An invitation has already been sent to this email.'
            )
        
        return email
    
    def validate_upi_id(self, value):
        """Validate UPI ID format if provided."""
        if value:
            value = value.strip()
            if value and '@' not in value:
                raise serializers.ValidationError(
                    'Invalid UPI ID format. Expected format: name@bank'
                )
        return value


class StaffInvitationDetailSerializer(serializers.ModelSerializer):
    """Serializer for viewing invitation details."""
    
    invited_by_name = serializers.CharField(source='invited_by.full_name', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = StaffInvitation
        fields = [
            'id', 'email', 'role', 'first_name', 'last_name', 'phone', 'upi_id',
            'invited_by_name', 'is_used', 'is_valid', 'is_expired',
            'created_at', 'expires_at'
        ]


class VerifyTokenSerializer(serializers.Serializer):
    """Serializer for verifying invitation token."""
    
    token = serializers.CharField()
    
    def validate_token(self, value):
        """Validate the invitation token."""
        try:
            invitation = StaffInvitation.objects.get(token=value)
        except StaffInvitation.DoesNotExist:
            raise serializers.ValidationError('Invalid invitation token.')
        
        if invitation.is_used:
            raise serializers.ValidationError('This invitation has already been used.')
        
        if invitation.is_expired:
            raise serializers.ValidationError('This invitation has expired.')
        
        return value


class StaffSetPasswordSerializer(serializers.Serializer):
    """
    Serializer for staff to set password after token verification.
    Creates the actual user account.
    """
    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    # Optional - staff can override if admin didn't provide
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=17, required=False, allow_blank=True)
    upi_id = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    
    def validate_token(self, value):
        """Validate the invitation token."""
        try:
            invitation = StaffInvitation.objects.get(token=value)
        except StaffInvitation.DoesNotExist:
            raise serializers.ValidationError('Invalid invitation token.')
        
        if invitation.is_used:
            raise serializers.ValidationError('This invitation has already been used.')
        
        if invitation.is_expired:
            raise serializers.ValidationError('This invitation has expired.')
        
        # Store invitation for later use
        self.invitation = invitation
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Ensure passwords match."""
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create the staff user account."""
        from django.utils import timezone
        
        invitation = self.invitation
        
        # Use provided data or fall back to invitation data
        first_name = validated_data.get('first_name') or invitation.first_name or 'Staff'
        last_name = validated_data.get('last_name') or invitation.last_name or 'User'
        phone = validated_data.get('phone') or invitation.phone
        upi_id = validated_data.get('upi_id') or invitation.upi_id
        
        # Create user
        user = User.objects.create_user(
            email=invitation.email,
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            upi_id=upi_id,
            role=invitation.role,
            is_email_verified=True,
            is_active=True,
        )
        
        # Mark invitation as used
        invitation.is_used = True
        invitation.used_at = timezone.now()
        invitation.save()
        
        return user

