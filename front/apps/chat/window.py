from apps.chat.fields import FirstNewChatButton
from apps.chat.sidebar import Sidebar
from apps.chat.dialog import CreateChatDialog, SettingsDialog
from apps.chat.models import ChatListModel
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (QVBoxLayout,QHBoxLayout, QWidget, QStackedWidget)
from .style import MAIN_COLOR, HOVER_MAIN_COLOR, first_chat_btn_style


class ChatScreen(QWidget):
    '''Основное окно чата.'''
    def __init__(self, window) -> None:
        super(ChatScreen, self).__init__()

        self.orig_window = window
        self.chats_model = ChatListModel()
        self.setMinimumSize(700, 570)

        layout = QHBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0,0,0,0)
    
        self.current_chat_index = None  # Хранит индекс текущего чата
        self.chat_widgets = []  # Список виджетов чатов

        # Добавляем виджеты в окно
        self.sidebar = Sidebar(self, self.orig_window)
        layout.addWidget(self.sidebar)

        self.stack = QStackedWidget(self)
        layout.addWidget(self.stack)

        self.first_chat_btn = FirstNewChatButton('+ Начать чат')
        self.first_chat_btn.setStyleSheet(first_chat_btn_style)
        self.first_chat_btn.clicked.connect(self.open_add_chat) 

        self.first_chat_layout = QVBoxLayout()
        self.first_chat_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.first_chat_layout.addWidget(self.first_chat_btn)
        self.first_chat = QWidget()
        self.first_chat.setLayout(self.first_chat_layout)
        self.stack.addWidget(self.first_chat)

        self.box = CreateChatDialog(self)
        self.box.create_btn.clicked.connect(lambda: self.sidebar.add_chat(self.box.image.path, self.box.user, self.box.chat_name))
        self.box.create_btn.clicked.connect(lambda: self.switch_chat(self.sidebar.num - 1))
        self.box.create_btn.clicked.connect(self.box.close)

        self.settings_dialog = SettingsDialog(self)

        self.setLayout(layout)
    
    def open_add_chat(self):
        self.box.setVisible(True)
        self.box.raise_()
        
    def resizeEvent(self, event):
        self.box.setGeometry(0, 0, self.width(), self.height())
        self.settings_dialog.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)

    def switch_chat(self, index):
        self.current_chat_index = index
        self.stack.setCurrentIndex(index + 1)
        self.sidebar.chat_list.viewport().update()
