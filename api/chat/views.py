from rest_framework import viewsets
from chat.models import Chat, Messages
from chat.serializer import ChatSerializer, MessagesSerializer
from rest_framework.permissions import IsAuthenticated

class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer

class MessagesViewSet(viewsets.ModelViewSet):
    queryset = Messages.objects.all()
    serializer_class = MessagesSerializer
    permission_classes = (IsAuthenticated, )

    def perform_create(self, serializer):
        chat_id = self.request.data.get('chat_id')
        chat = Chat.objects.get(id=chat_id)
        serializer.save(chat=chat, user=self.request.user)
