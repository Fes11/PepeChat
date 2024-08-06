from django.urls import path, include
from rest_framework import routers

from account.views import UserViewSet

router = routers.DefaultRouter()
router.register(r'user', UserViewSet)

urlpatterns = [
    path('users/', include(router.urls)),
    path('auth/', include('rest_framework.urls'))
]