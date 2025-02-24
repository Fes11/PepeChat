from PySide6.QtCore import QObject, Signal


class ChatModel(QObject):
    avatar_changed = Signal(str)  # Сигнал с путем к новому изображению

    def __init__(self, chat_name, users, avatar_path, description, chat_type='private'):
        super().__init__()
        self.chat_name = chat_name
        self.users = users
        self._avatar_path = avatar_path  # Используем _avatar_path вместо avatar_path
        self.chat_type = chat_type  # 'private' или 'group'
        self.description = description
        self.messages = []
        self.online = True
        self.superuser = True
        self.admin = True

    @property
    def avatar_path(self):
        return self._avatar_path

    @avatar_path.setter
    def avatar_path(self, new_path):
        if self._avatar_path != new_path:
            self._avatar_path = new_path
            self.avatar_changed.emit(new_path)  # Отправляем сигнал с новым путемём
            print('Signal new_path: ', new_path)


class UserModel:
    def __init__(self, username, login, email, name_in_chat='NameVChate', avatar='static/image/person.png'):
        super().__init__()
        self.username = username
        self.login = login
        self.email = email
        self.avatar = avatar
        self.name_in_chat = name_in_chat


class ProfileModel(UserModel):
    def __init__(self, descriptions, profile_bg_image='static/image/ava2.jpg'):
        super().__init__()
        self.descriptions = descriptions
        self.profile_bg_image = profile_bg_image
