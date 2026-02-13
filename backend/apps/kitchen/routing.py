from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/kitchen/orders/$', consumers.KitchenConsumer.as_asgi()),
    re_path(r'kitchen/orders/$', consumers.KitchenConsumer.as_asgi()),  # Also allow without ws prefix
    re_path(r'ws/kitchen/orders/(?P<order_id>\w+)/$', consumers.KitchenConsumer.as_asgi()),
    re_path(r'kitchen/orders/(?P<order_id>\w+)/$', consumers.KitchenConsumer.as_asgi()),
]
