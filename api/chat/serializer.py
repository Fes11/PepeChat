from rest_framework import serializers
from .models import Chat, Messages
from account.serializer import UserSerializer

        
from rest_framework import serializers
from .models import Messages

class MessagesSerializer(serializers.ModelSerializer):
    chat_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Messages
        fields = ['id', 'text', 'chat_id', 'user', 'time_created']



class ChatSerializer(serializers.ModelSerializer):
    chat_messages = MessagesSerializer(many=True)
    users = UserSerializer(many=True)
    
    class Meta:
        model = Chat
        fields = ['title', 'users', 'chat_messages']