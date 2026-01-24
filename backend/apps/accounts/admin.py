"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StaffInvitation


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""
    
    list_display = ['email', 'full_name', 'role', 'is_active', 'is_email_verified', 'created_at']
    list_filter = ['role', 'is_active', 'is_email_verified', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'upi_id')}),
        ('Role & Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_email_verified')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['created_at', 'last_login']


@admin.register(StaffInvitation)
class StaffInvitationAdmin(admin.ModelAdmin):
    """Admin for StaffInvitation model."""
    
    list_display = ['email', 'role', 'invited_by', 'is_used', 'expires_at', 'created_at']
    list_filter = ['role', 'is_used', 'created_at']
    search_fields = ['email']
    ordering = ['-created_at']
    readonly_fields = ['token', 'created_at', 'used_at']
