from django.urls import path, include
from rest_framework import routers

from chat.views import ChatViewSet

router = routers.DefaultRouter()
router.register(r'chat', ChatViewSet)

urlpatterns = [
    path('', include(router.urls))
]