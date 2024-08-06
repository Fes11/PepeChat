from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from conf import settings

# Create your models here.
class Messages(models.Model):
    text = models.TextField(max_length=500)
    chat = models.ForeignKey("chat.Chat", related_name='chat_messages', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='user_messages', on_delete=models.CASCADE)
    time_created = models.DateTimeField(_("time created"), default=timezone.now)
    
    class Meta:
        db_table = 'message'
        verbose_name = 'Сообщения'
        verbose_name_plural = 'Сообщения'
        
    def __str__(self):
        return f'{self.user.username} - {self.text}'


class Chat(models.Model):
    title = models.CharField(max_length=200, verbose_name='Название чата')
    users = models.ManyToManyField("account.User", related_name='users_in_rooms')
    
    class Meta:
        db_table = 'chat'
        verbose_name = 'Чата'
        verbose_name_plural = 'Чаты'
        
    def __str__(self):
        return self.title
