from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
 
from account.models import User

class UserAdmin(admin.ModelAdmin):
    fields = ('username', 'img', 'chat', 'is_staff', 'date_joined', 'last_login')

admin.site.register(User, UserAdmin)