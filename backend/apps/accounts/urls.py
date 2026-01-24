"""
URL configuration for accounts app.
"""
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Public auth endpoints
    path('register/', views.OwnerRegistrationView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.TokenRefreshAPIView.as_view(), name='token_refresh'),
    
    # Profile management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/upi/', views.UpdateUPIView.as_view(), name='update_upi'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # User management (Admin only)
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:user_id>/', views.UserDetailView.as_view(), name='user_detail'),
    
    # Staff invitation (Admin creates invitations)
    path('staff/invite/', views.StaffInviteView.as_view(), name='staff_invite'),
    path('staff/invitations/', views.StaffInvitationListView.as_view(), name='invitation_list'),
    path('staff/invitations/<int:invitation_id>/resend/', views.ResendInvitationView.as_view(), name='resend_invitation'),
    path('staff/invitations/<int:invitation_id>/', views.DeleteInvitationView.as_view(), name='delete_invitation'),
    
    # Staff onboarding (Public - token-based)
    path('staff/verify-token/<str:token>/', views.VerifyTokenView.as_view(), name='verify_token'),
    path('staff/set-password/', views.StaffSetPasswordView.as_view(), name='set_password'),
]
