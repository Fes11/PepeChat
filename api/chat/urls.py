from django.urls import path, include
from rest_framework import routers

from chat.views import ChatViewSet, MessagesViewSet

chat_router = routers.DefaultRouter()
chat_router.register(r'chat_list', ChatViewSet)

mes_router = routers.DefaultRouter()
mes_router.register(r'messages', MessagesViewSet)

urlpatterns = [
    path('', include(chat_router.urls)),
    path('', include(mes_router.urls))
]