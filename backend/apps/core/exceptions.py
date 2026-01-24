"""
Custom exception handler for enterprise-grade API responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent API error responses.
    
    Response format:
    {
        "success": false,
        "message": "Human-readable error message",
        "errors": {
            "field_name": ["error1", "error2"],
            ...
        },
        "error_code": "ERROR_CODE"
    }
    """
    # Get the standard error response
    response = exception_handler(exc, context)
    
    # Log the exception
    if response is not None and response.status_code in [401, 403]:
        # Log auth/permission errors as warnings without full traceback
        user = context.get('request').user if context.get('request') else 'Anonymous'
        method = context.get('request').method if context.get('request') else 'Unknown'
        path = context.get('request').path if context.get('request') else 'Unknown'
        
        logger.warning(
            f"Permission/Auth denied in {context.get('view').__class__.__name__ if hasattr(context.get('view'), '__class__') else 'Unknown'}: "
            f"{str(exc)} | User: {user} | {method} {path}"
        )
    else:
        # Log unexpected errors as ERROR with traceback
        logger.error(
            f"Exception in {context.get('view', 'Unknown')}: {str(exc)}",
            exc_info=True,
            extra={'request': context.get('request')}
        )
    
    if response is not None:
        # Customize the response format
        custom_response = {
            'success': False,
            'message': get_error_message(exc, response),
            'errors': get_errors_dict(exc, response),
            'error_code': get_error_code(exc, response),
        }
        response.data = custom_response
        return response
    
    # Handle Django ValidationError
    if isinstance(exc, DjangoValidationError):
        return Response(
            {
                'success': False,
                'message': 'Validation failed',
                'errors': {'detail': exc.messages if hasattr(exc, 'messages') else [str(exc)]},
                'error_code': 'VALIDATION_ERROR',
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle unexpected exceptions
    return Response(
        {
            'success': False,
            'message': 'An unexpected error occurred',
            'errors': {'detail': [str(exc)]},
            'error_code': 'INTERNAL_SERVER_ERROR',
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def get_error_message(exc, response):
    """Extract a human-readable error message."""
    if isinstance(exc, DRFValidationError):
        return 'Validation failed'
    
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, str):
            return exc.detail
        if isinstance(exc.detail, dict) and 'detail' in exc.detail:
            return str(exc.detail['detail'])
    
    status_code = response.status_code
    messages = {
        400: 'Bad request',
        401: 'Authentication required',
        403: 'Permission denied',
        404: 'Resource not found',
        405: 'Method not allowed',
        429: 'Too many requests',
        500: 'Internal server error',
    }
    return messages.get(status_code, 'An error occurred')


def get_errors_dict(exc, response):
    """Extract errors as a dictionary."""
    if isinstance(exc, DRFValidationError) and isinstance(exc.detail, dict):
        errors = {}
        for field, messages in exc.detail.items():
            if isinstance(messages, list):
                errors[field] = [str(m) for m in messages]
            else:
                errors[field] = [str(messages)]
        return errors
    
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, list):
            return {'detail': [str(d) for d in exc.detail]}
        return {'detail': [str(exc.detail)]}
    
    return {'detail': [str(exc)]}


def get_error_code(exc, response):
    """Generate an error code based on exception type."""
    error_codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        429: 'RATE_LIMIT_EXCEEDED',
        500: 'INTERNAL_SERVER_ERROR',
    }
    
    if isinstance(exc, DRFValidationError):
        return 'VALIDATION_ERROR'
    
    return error_codes.get(response.status_code, 'ERROR')
