from django.urls import path
from . import views

app_name = 'sessions'

urlpatterns = [
    path('current/', views.CurrentSessionView.as_view(), name='current_session'),
    path('last/', views.LastSessionView.as_view(), name='last_session'),
    path('history/', views.SessionHistoryView.as_view(), name='session_history'),
    path('open/', views.OpenSessionView.as_view(), name='open_session'),
    path('<int:pk>/close/', views.CloseSessionView.as_view(), name='close_session'),
]
