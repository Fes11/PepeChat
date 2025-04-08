from PySide6.QtCore import QObject, Qt, QAbstractListModel, Signal, QModelIndex 
from PySide6.QtGui import QPixmap
import datetime


class ChatModel(QObject):
    data_changed = Signal()
    avatar_changed = Signal(str)

    def __init__(self, chat_name, users, avatar_path, description, chat_type='private'):
        super().__init__()
        self.chat_name = chat_name
        self.users = users
        self.avatar_path = avatar_path
        self.chat_type = chat_type
        self.description = description
        self.messages = []
        self.online = True
        self.unread = 0
        self.last_message_time = datetime.datetime.now()

    # Геттеры и сеттеры с сигналами
    @property
    def avatar_path(self):
        return self._avatar_path

    @avatar_path.setter
    def avatar_path(self, value):
        self._avatar_path = value
        self.avatar_changed.emit(value)
        self.data_changed.emit()

    @property
    def unread(self):
        return self._unread

    @unread.setter
    def unread(self, value):
        self._unread = value
        self.data_changed.emit()

    # Аналогично для остальных свойств...

class ChatListModel(QAbstractListModel):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.chats = []

    def rowCount(self, parent=QModelIndex()):
        return len(self.chats)

    def data(self, index, role=Qt.ItemDataRole.DisplayRole):
        if not index.isValid():
            return None
        
        chat = self.chats[index.row()]

        if role == Qt.ItemDataRole.UserRole:
            return chat
        elif role == Qt.ItemDataRole.DecorationRole:
            return QPixmap(chat.avatar_path)
        elif role == Qt.ItemDataRole.DisplayRole:
            return chat.chat_name
        return None

    def add_chat(self, chat):
        self.beginInsertRows(QModelIndex(), self.rowCount(), self.rowCount())
        self.chats.append(chat)
        chat.data_changed.connect(lambda: self.update_chat(chat))
        self.endInsertRows()

    def update_chat(self, chat):
        index = self.chats.index(chat)
        self.dataChanged.emit(self.index(index), self.index(index))

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
