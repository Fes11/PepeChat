from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    img = models.ImageField(unique=False, blank=True, null=True, verbose_name='Аватарка')
    chat = models.ManyToManyField("chat.Chat", verbose_name="Чаты", related_name='chat_rooms')
    
    
    class Meta:
        db_table = 'user'
        verbose_name = 'Пользователя'
        verbose_name_plural = 'Пользователи'
        
    def __str__(self):
        return self.username