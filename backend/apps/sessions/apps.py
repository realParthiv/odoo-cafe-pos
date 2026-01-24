from django.apps import AppConfig


class POSSessionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sessions'
    label = 'pos_sessions'  # Unique label to avoid conflict with django.contrib.sessions
    verbose_name = 'POS Sessions'
