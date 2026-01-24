"""
Custom User model and related models for Café POS system.
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError('Email address is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Café POS system.
    
    Uses email for authentication instead of username.
    Supports role-based access control (Admin, Cashier, Kitchen Staff).
    """
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin/Owner'
        CASHIER = 'cashier', 'Cashier'
        KITCHEN = 'kitchen', 'Kitchen Staff'
    
    # Primary fields
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(
        verbose_name='Email Address',
        max_length=255,
        unique=True,
        db_index=True
    )
    
    # Profile fields
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True
    )
    
    # Role and permissions
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN
    )
    
    # Cashier-specific fields
    upi_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='UPI ID for payment collection (cashiers only)'
    )
    
    # Status flags
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active', 'role']),
        ]
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_admin(self):
        """Check if user is an admin/owner."""
        return self.role == self.Role.ADMIN
    
    @property
    def is_cashier(self):
        """Check if user is a cashier."""
        return self.role == self.Role.CASHIER
    
    @property
    def is_kitchen_staff(self):
        """Check if user is kitchen staff."""
        return self.role == self.Role.KITCHEN
    
    def save(self, *args, **kwargs):
        """Override save to handle role-specific logic."""
        # Admins should always be staff
        if self.role == self.Role.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)


class StaffInvitation(models.Model):
    """
    Model for staff invitation tokens.
    
    Admin sends invitation → Staff receives email with token →
    Staff clicks link → Verifies token → Sets password
    """
    
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=255, db_index=True)
    token = models.CharField(max_length=100, unique=True, db_index=True)
    
    role = models.CharField(
        max_length=20,
        choices=[
            (User.Role.CASHIER, 'Cashier'),
            (User.Role.KITCHEN, 'Kitchen Staff'),
        ]
    )
    
    # Optional fields pre-filled by admin
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=17, blank=True)
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Invitation tracking
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    is_used = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Staff Invitation'
        verbose_name_plural = 'Staff Invitations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['email', 'is_used']),
        ]
    
    def __str__(self):
        return f"Invitation for {self.email} ({self.role})"
    
    @property
    def is_expired(self):
        """Check if invitation has expired."""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if invitation is valid (not used and not expired)."""
        return not self.is_used and not self.is_expired
    
    @classmethod
    def generate_token(cls):
        """Generate a unique invitation token."""
        return uuid.uuid4().hex
