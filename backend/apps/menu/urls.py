from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'menu'

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
