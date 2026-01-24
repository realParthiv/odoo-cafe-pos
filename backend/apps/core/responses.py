"""
Base response utilities for consistent API responses.
"""
from rest_framework.response import Response
from rest_framework import status


class APIResponse:
    """
    Standardized API response builder.
    
    Usage:
        return APIResponse.success(data={'user': user_data}, message='User created')
        return APIResponse.error(message='Invalid credentials', error_code='INVALID_CREDENTIALS')
    """
    
    @staticmethod
    def success(data=None, message='Success', status_code=status.HTTP_200_OK):
        """
        Return a successful response.
        
        {
            "success": true,
            "message": "Success message",
            "data": {...}
        }
        """
        response_data = {
            'success': True,
            'message': message,
        }
        if data is not None:
            response_data['data'] = data
        return Response(response_data, status=status_code)
    
    @staticmethod
    def created(data=None, message='Created successfully'):
        """Return a 201 Created response."""
        return APIResponse.success(data, message, status.HTTP_201_CREATED)
    
    @staticmethod
    def error(
        message='An error occurred',
        errors=None,
        error_code='ERROR',
        status_code=status.HTTP_400_BAD_REQUEST
    ):
        """
        Return an error response.
        
        {
            "success": false,
            "message": "Error message",
            "errors": {...},
            "error_code": "ERROR_CODE"
        }
        """
        response_data = {
            'success': False,
            'message': message,
            'error_code': error_code,
        }
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=status_code)
    
    @staticmethod
    def unauthorized(message='Authentication required'):
        """Return a 401 Unauthorized response."""
        return APIResponse.error(
            message=message,
            error_code='UNAUTHORIZED',
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def forbidden(message='Permission denied'):
        """Return a 403 Forbidden response."""
        return APIResponse.error(
            message=message,
            error_code='FORBIDDEN',
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def not_found(message='Resource not found'):
        """Return a 404 Not Found response."""
        return APIResponse.error(
            message=message,
            error_code='NOT_FOUND',
            status_code=status.HTTP_404_NOT_FOUND
        )
