

class ChatModel:
    def __init__(self, chat_name, users, avatar_path, description, chat_type='private'):
        self.chat_name = chat_name
        self.users = users
        self.avatar_path = avatar_path
        self.chat_type = chat_type  # 'private' or 'group'
        self.description = description
        self.messages = []


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
