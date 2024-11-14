import re
from apps.chat.chat_area import MessagesList
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, TEXT_COLOR, HOVER_MAIN_COLOR
from datetime import datetime
from PySide6.QtGui import QIcon, QCursor, QPixmap, QColor, QMouseEvent
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property
from PySide6.QtWidgets import (QTextEdit, QScrollArea, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton)
from apps.profile.profile import Profile
from apps.chat.serach import UsernameSearchWidget



class ChatModel:
    def __init__(self, chat_name, users, avatar_path, description, chat_type='private'):
        self.chat_name = chat_name
        self.users = users
        self.avatar_path = avatar_path
        self.chat_type = chat_type  # 'private' or 'group'
        self.description = description
        self.messages = []


class ChatWidget(QWidget):
    def __init__(self, main_window, num, model: ChatModel):
        super().__init__()
        self.main_window = main_window
        self.model = model
        self.num = num

        layout = QHBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        chat_info = QWidget()
        chat_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')

        self.chat_info_layout = QVBoxLayout()
        self.chat_info_layout.setSpacing(0)
        self.chat_info_layout.setContentsMargins(0, 0, 0, 0)
        chat_info.setLayout(self.chat_info_layout)

        self.chat_name = QLabel(model.chat_name)
        self.chat_name.setMaximumHeight(50)
        self.chat_name.setStyleSheet(f'''QLabel {{background-color: rgba(0, 0, 0, 0); color: {TEXT_COLOR}; font-weight: bold; font-size: 13px;}}''')
        self.chat_info_layout.addWidget(self.chat_name)

        self.last_message = QLabel('Сообщение...')
        self.last_message.setMaximumHeight(50)
        self.last_message.setStyleSheet('''QLabel {color: #b5b5b5;}''')
        self.chat_info_layout.addWidget(self.last_message)

        chat_avatar = QPushButton(self)
        chat_avatar.setFixedSize(40, 40)
        avatar_radius = 10 if model.chat_type == 'group' else 20
        chat_avatar.setStyleSheet(f'''QPushButton {{border: none; background-color: white; border-radius: {avatar_radius}px}}''')
        chat_avatar.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
        chat_avatar.setIcon(QIcon(model.avatar_path))  # Установите путь к вашему изображению
        chat_avatar.setIconSize(QSize(25, 25))

        self.chat_time_layout = QVBoxLayout()
        self.chat_time_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.chat_time_layout.setSpacing(8)
        self.chat_time_layout.setContentsMargins(0,0,0,0)

        self.chat_time = QLabel(datetime.now().strftime('%H:%M'))
        self.chat_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.5); background: rgba(0, 0, 0, 0);}')

        # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)  # радиус размытия
        rgba = list(map(int, re.findall(r'\d+', MAIN_COLOR)))
        color = QColor(rgba[0], rgba[1], rgba[2])
        self.glow.setColor(color)  # цвет свечения
        self.glow.setOffset(0, 0)  # смещение тени
        
        self.new_mess = QLabel('1')
        self.new_mess.setContentsMargins(0,0,0,0)
        self.new_mess.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.new_mess.setFixedSize(16,16)
        self.new_mess.setStyleSheet(f'''QLabel {{background-color: {MAIN_COLOR}; color: white; border-radius: 8px;
                                         font-weight: bold; font-size: 10px;}}''')
        # Применение эффекта к new_mess
        self.new_mess.setGraphicsEffect(self.glow)
        
        new_mess_layout = QHBoxLayout()
        new_mess_layout.setAlignment(Qt.AlignmentFlag.AlignRight)
        new_mess_layout.addWidget(self.new_mess)

        self.chat_time_layout.addWidget(self.chat_time)
        self.chat_time_layout.addLayout(new_mess_layout)

        self.chat_layout = QHBoxLayout()
        self.chat_layout.addWidget(chat_avatar)
        self.chat_layout.addWidget(chat_info)
        self.chat_layout.addStretch()
        self.chat_layout.addLayout(self.chat_time_layout)

        self.chat_widget = QPushButton(self)
        self.chat_widget.setContentsMargins(5, 0, 0, 0)
        self.chat_widget.setObjectName("chat_widget")
        self.chat_widget.setFixedHeight(60)
        self.chat_widget.setStyleSheet('''#chat_widget {background-color: rgba(0, 0, 0, 0); border:none; border-radius: 0px; background-color: none;} 
                                          #chat_widget:hover {background-color: rgba(255,255,255, 0.1); border-radius: 0px;}''')
        self.chat_widget.setCursor(QCursor(Qt.PointingHandCursor))
        # Подключаем сигнал с передачей индекса
        self.chat_widget.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
        self.chat_widget.setLayout(self.chat_layout)

        layout.addWidget(self.chat_widget)
        self.setLayout(layout)

    def resizeEvent(self, event):
        if self.size().width() < 200:
            self.chat_name.setVisible(False)
            self.chat_time.setVisible(False)
            self.new_mess.move(10,10)
            self.last_message.setVisible(False)
        else:
            self.chat_name.setVisible(True)
            self.chat_time.setVisible(True)
            self.new_mess.setVisible(True)
            self.last_message.setVisible(True)
        super().resizeEvent(event)


class PrivateChatWidget(ChatWidget):
    '''Личный чат между двумя людьми. '''
    def __init__(self, main_window, model: ChatModel):
        super().__init__(main_window, model)


class GroupChatWidget(ChatWidget):
    '''Публичный чат для нескольких пользователей. '''
    def __init__(self, main_window, model: ChatModel):
        super().__init__(main_window, model)


class GroupChat(QWidget):
    '''Групповой чат, в котором может быть несколько чатов. '''
    def __init__(self):
        super().__init__()
