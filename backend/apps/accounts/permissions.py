"""
Custom permissions for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Permission check for Admin/Owner role.
    """
    message = 'Admin access required.'
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.role == 'admin'
        )


class IsCashier(BasePermission):
    """
    Permission check for Cashier role.
    """
    message = 'Cashier access required.'
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.role == 'cashier'
        )


class IsKitchenStaff(BasePermission):
    """
    Permission check for Kitchen Staff role.
    """
    message = 'Kitchen staff access required.'
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.role == 'kitchen'
        )


class IsAdminOrCashier(BasePermission):
    """
    Permission check for Admin or Cashier role.
    """
    message = 'Admin or Cashier access required.'
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.role in ['admin', 'cashier']
        )


class IsStaff(BasePermission):
    """
    Permission check for any staff role (Admin, Cashier, or Kitchen).
    """
    message = 'Staff access required.'
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.role in ['admin', 'cashier', 'kitchen']
        )
