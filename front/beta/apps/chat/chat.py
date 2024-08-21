from PySide6.QtGui import QIcon, QCursor, QPixmap
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QScrollArea, QVBoxLayout, QLabel,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QStackedWidget)

from apps.chat.style import MAIN_BOX_COLOR
from apps.profile.profile import MiniProfile
from apps.chat.messages import MessagesList
from apps.chat.chat_window import MainWindow
from window import Window

class ChatWidget(QWidget):
    def __init__(self, num):
        super().__init__()

        layout = QHBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        chat_info = QWidget()
        chat_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')
        
        chat_info_layout = QVBoxLayout()
        chat_info_layout.setSpacing(0)
        chat_info_layout.setContentsMargins(0,0,0,0)
        chat_info.setLayout(chat_info_layout)

        chat_name = QLabel(f'Название чата {num}')
        chat_name.setMaximumHeight(50)
        chat_name.setStyleSheet('''QLabel {font-weight: bold; font-size: 13px;}''')
        chat_info_layout.addWidget(chat_name)

        last_message = QLabel('Сообщение...')
        last_message.setMaximumHeight(50)
        last_message.setStyleSheet('''QLabel {color: #b5b5b5;}''')
        chat_info_layout.addWidget(last_message)

        chat_avatar = QPushButton()
        chat_avatar.setFixedSize(40, 40)
        chat_avatar.setStyleSheet('''QPushButton {background-color: white; border-radius: 20px}''')
        chat_avatar.setIcon(QIcon('static/image/person.png'))  # Установите путь к вашему изображению
        chat_avatar.setIconSize(QSize(25, 25))

        chat_layout = QHBoxLayout()
        chat_layout.addWidget(chat_avatar)
        chat_layout.addWidget(chat_info)

        self.chat_widget = QPushButton()
        self.chat_widget.setObjectName("chat_widget")
        self.chat_widget.setFixedHeight(60)
        self.chat_widget.setStyleSheet('''QPushButton {border:none;} QPushButton:hover {background-color: #4a4a4a;}''')
        self.chat_widget.setCursor(QCursor(Qt.PointingHandCursor))
        self.chat_widget.clicked.connect(self.switch_chat)
        self.chat_widget.setLayout(chat_layout)

        layout.addWidget(self.chat_widget)
        self.setLayout(layout)        
    
    def switch_chat(self):
        chat_name = self.findChild(QLabel).text()
        print(f"Chat clicked: {chat_name}")

        MainWindow().stack.setCurrentWidget(1)


class Sidebar(QWidget):
    '''Боковая панель с чатами, поиском и кнопкой добавления чатов. '''

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumSize(200, 580)
        self.setMaximumWidth(300)

        self.num = 0

        # Настройки Sidebar
        widget = QWidget()
        widget.setContentsMargins(7, 7, 7, 0)
        widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px; border: none;}}''')
        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        # Основной слой
        self.sidebar_layout = QVBoxLayout()
        self.sidebar_layout.setContentsMargins(7,7,0,0)
        self.sidebar_layout.setSpacing(15)

        self.chat_scroll = QScrollArea()
        self.chat_scroll.setWidgetResizable(True)
        self.chat_scroll.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.chat_scroll.setStyleSheet('''QWidget {border: none;}''')

        self.chat_list_layout = QVBoxLayout()
        self.chat_list_layout.setContentsMargins(0,0,0,0)
        self.chat_list_layout.setSpacing(0)
        self.chat_list_layout.setAlignment(Qt.Alignment.AlignTop)

        self.chat_list = QWidget()
        self.chat_list.setLayout(self.chat_list_layout)

        self.chat_scroll.setWidget(self.chat_list)

        # Поиск 
        self.serch = QTextEdit()
        self.serch.setMaximumHeight(40)
        self.serch.setPlaceholderText("Поиск...")
        self.serch.setStyleSheet('''QTextEdit {background-color: rgba(255, 255, 255, 0.1); color: white; border-radius: 16px; padding: 8px 0 5px 10px;}''')

        serch_layout = QHBoxLayout()

        logo = QLabel(self)
        pixmap = QPixmap('static/image/logo.png')
        pixmap.scaled(30, 30)
        logo.setPixmap(pixmap)
        
        serch_layout.addWidget(logo)
        serch_layout.addWidget(self.serch)

        self.new_chat_btn = QPushButton()
        self.new_chat_btn.setFixedSize(40, 40)
        self.new_chat_btn.setIcon(QIcon('static/image/add.png'))  # Установите путь к вашему изображению
        self.new_chat_btn.setIconSize(QSize(25, 25))
        self.new_chat_btn.clicked.connect(self.add_chat)
        self.new_chat_btn.setStyleSheet('''QPushButton {background-color: #4a4a4a; color:white; border:none; padding: 5px;}
                                           QPushButton:hover{background-color: grey;}''')
        self.new_chat_btn.setCursor(QCursor(Qt.PointingHandCursor))
        
        chat_list_lable = QLabel('Chats')
        chat_list_lable.setStyleSheet('''QLabel {color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold; padding-left: 2px;}''')

        # Добавляем виджеты
        self.sidebar_layout.addLayout(serch_layout)
        self.sidebar_layout.addWidget(self.new_chat_btn)
        self.sidebar_layout.addWidget(chat_list_lable)
        self.sidebar_layout.addWidget(self.chat_scroll)
        
        widget.setLayout(self.sidebar_layout)

        layout.addWidget(widget)
        layout.addWidget(MiniProfile())
        self.setLayout(layout)
        
    def add_chat(self):
        self.num += 1
        chat_widget = ChatWidget(self.num)
        self.chat_list_layout.addWidget(chat_widget)
        
        MainWindow().stack.addWidget(MessagesList())
