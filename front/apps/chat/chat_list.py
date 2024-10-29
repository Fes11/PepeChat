from apps.chat.chat_area import MessagesList
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, TEXT_COLOR, HOVER_MAIN_COLOR
from dialog import DialogWindow
from apps.chat.fields import DarkenButton, FirstNewChatButton, UserWidget
from window import Window
from datetime import datetime
from PySide6.QtGui import QIcon, QCursor, QPixmap, QColor, QTransform
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget, QLineEdit, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QStackedWidget, QListWidgetItem)
from apps.profile.profile import Profile


class ChatWidget(QWidget):
    def __init__(self, main_window, num):
        super().__init__()
        self.main_window = main_window
        self.num = num
        layout = QHBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        chat_info = QWidget()
        chat_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')

        self.chat_info_layout = QVBoxLayout()
        self.chat_info_layout.setSpacing(0)
        self.chat_info_layout.setContentsMargins(0, 0, 0, 0)
        chat_info.setLayout(self.chat_info_layout)

        self.chat_name = QLabel(f'Название чата {num}')
        self.chat_name.setMaximumHeight(50)
        self.chat_name.setStyleSheet(f'''QLabel {{background-color: rgba(0, 0, 0, 0); color: {TEXT_COLOR}; font-weight: bold; font-size: 13px;}}''')
        self.chat_info_layout.addWidget(self.chat_name)

        self.last_message = QLabel('Сообщение...')
        self.last_message.setMaximumHeight(50)
        self.last_message.setStyleSheet('''QLabel {color: #b5b5b5;}''')
        self.chat_info_layout.addWidget(self.last_message)

        chat_avatar = QPushButton(self)
        chat_avatar.setFixedSize(40, 40)
        chat_avatar.setStyleSheet('''QPushButton {border: none; background-color: white; border-radius: 20px}''')
        chat_avatar.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
        chat_avatar.setIcon(QIcon('static/image/person.png'))  # Установите путь к вашему изображению
        chat_avatar.setIconSize(QSize(25, 25))

        self.chat_time_layout = QVBoxLayout()
        self.chat_time_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.chat_time_layout.setSpacing(8)
        self.chat_time_layout.setContentsMargins(0,0,0,0)

        self.chat_time = QLabel(datetime.now().strftime('%H:%M'))
        self.chat_time.setStyleSheet('QLabel {color: rgba(169, 171, 173, 1); background: rgba(0, 0, 0, 0);}')

        # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)  # радиус размытия
        self.glow.setColor(QColor(123, 97, 255))  # цвет свечения
        self.glow.setOffset(0, 0)  # смещение тени
        
        self.new_mess = QLabel('1')
        self.new_mess.setContentsMargins(0,0,0,0)
        self.new_mess.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.new_mess.setFixedSize(16,16)
        self.new_mess.setStyleSheet('''QLabel {background-color:rgba(123, 97, 255, 1); color: white; border-radius: 8px;
                                         font-weight: bold; font-size: 10px;}''')
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


class Sidebar(QWidget):
    '''Боковая панель с чатами, поиском и кнопкой добавления чатов.'''

    def __init__(self, main_window, parent=None):
        super().__init__(parent)
        self.main_window = main_window
        self.setMinimumWidth(65)
        self.setMaximumWidth(300)

        self.num = 0

        # Настройки Sidebar
        widget = QWidget()
        widget.setObjectName('widget')
        widget.setContentsMargins(0, 0, 0, 0)
        widget.setStyleSheet(f'''#widget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px; border: none;}}''')
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        # Основной слой
        self.sidebar_layout = QVBoxLayout()
        self.sidebar_layout.setContentsMargins(0, 0, 0, 0)
        self.sidebar_layout.setSpacing(13)

        self.chat_scroll = QScrollArea()
        self.chat_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.chat_scroll.setContentsMargins(0, 0, 0, 0)
        self.chat_scroll.setWidgetResizable(True)
        self.chat_scroll.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.chat_scroll.setStyleSheet('''QWidget {border: none;}''')

        self.chat_list_layout = QVBoxLayout()
        self.chat_list_layout.setContentsMargins(0, 0, 0, 0)
        self.chat_list_layout.setSpacing(0)
        self.chat_list_layout.setAlignment(Qt.Alignment.AlignTop)

        self.sidebar = QWidget()
        self.sidebar.setLayout(self.chat_list_layout)

        self.chat_scroll.setWidget(self.sidebar)

        # Поиск
        self.search_layout = QHBoxLayout()
        self.search_layout.setSpacing(0)
        self.search_layout.setContentsMargins(0,0,0,0)

        self.search_widget = QWidget()
        self.search_widget.setMaximumHeight(40)
        self.search_widget.setStyleSheet('''background-color: rgba(255, 255, 255, 0.1); color: white; 
                                            border-radius: 16px;''')

        self.seatch_image = QPushButton()
        self.seatch_image.setFixedSize(30, 40)
        self.seatch_image.setStyleSheet('''background-color: rgba(255, 255, 255, 0); padding-left: 10px;''')
        self.seatch_image.setIcon(QIcon('static/image/search_icon.png'))  # Установите путь к вашему изображению
        self.seatch_image.setIconSize(QSize(24, 24))

        self.serch = QTextEdit()
        self.serch.setStyleSheet('''background-color: rgba(255, 255, 255, 0); padding-top: 8px; padding-left: 5px;
                                    font-weight: bold;''')
        self.serch.setPlaceholderText("Search...")

        self.search_layout.addWidget(self.seatch_image)
        self.search_layout.addWidget(self.serch)
        self.search_widget.setLayout(self.search_layout)

        top_layout = QHBoxLayout()
        top_layout.setSpacing(10)
        top_layout.setContentsMargins(0,0,0,0)

        logo = QLabel(self)
        pixmap = QPixmap('static/image/logo.png')
        pixmap.scaled(30, 30)
        logo.setPixmap(pixmap)

        # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)  # радиус размытия
        self.glow.setColor(QColor(123, 97, 255))  # цвет свечения
        self.glow.setOffset(0, 0)  # смещение тени
        logo.setGraphicsEffect(self.glow)

        top_layout.addWidget(logo)
        top_layout.addWidget(self.search_widget)

        self.new_chat_btn = QPushButton()
        self.new_chat_btn.setFixedHeight(35)
        self.new_chat_btn.setIcon(QIcon('static/image/add.png'))  # Установите путь к вашему изображению
        self.new_chat_btn.setIconSize(QSize(16, 16))
        self.new_chat_btn.clicked.connect(self.main_window.open_add_chat)
        self.new_chat_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; color: white;
                                                          font-weight: bold; border:none; font-size: 11px; border-radius: 10px;}}
                                           QPushButton:hover{{background-color: {HOVER_MAIN_COLOR};}}''')
        self.new_chat_btn.setCursor(QCursor(Qt.PointingHandCursor))

        self.new_chat_btn_layout = QVBoxLayout()
        self.new_chat_btn_layout.setSpacing(0)
        self.new_chat_btn_layout.setContentsMargins(10,10,10,10)
        self.new_chat_btn_layout.addWidget(self.new_chat_btn)

        chat_list_lable = QLabel('Chats')
        chat_list_lable.setFixedSize(40,10)
        chat_list_lable.setStyleSheet('''QLabel {color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold; padding-left: 2px;}''')

        top_sidebar = QVBoxLayout()
        top_sidebar.setContentsMargins(10, 10, 10, 0)

        # Добавляем виджеты
        top_sidebar.addLayout(top_layout)
        top_sidebar.addWidget(chat_list_lable)
        self.sidebar_layout.addLayout(top_sidebar)
        self.sidebar_layout.addWidget(self.chat_scroll)
        self.sidebar_layout.addLayout(self.new_chat_btn_layout)

        widget.setLayout(self.sidebar_layout)

        self.mini_profile = Profile()

        layout.addWidget(widget)
        layout.addWidget(self.mini_profile)
        self.setLayout(layout)

    def resizeEvent(self, event):
        if self.size().width() < 250:
            self.setMaximumWidth(65)
            self.new_chat_btn.setText('')
            self.search_widget.setVisible(False)
            self.mini_profile.user_widget.username.setVisible(False)
            self.mini_profile.user_widget.user_id.setVisible(False)
            self.mini_profile.send_change_profile.setVisible(False)
            self.mini_profile.arrow_btn.setVisible(False)
            self.mini_profile.settings.setVisible(False)
            self.mini_profile.user_widget.data_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        else:
            self.new_chat_btn.setText('  Создать чат')
            self.search_widget.setVisible(True)
            self.mini_profile.user_widget.username.setVisible(True)
            self.mini_profile.user_widget.user_id.setVisible(True)
            self.mini_profile.arrow_btn.setVisible(True)
            self.mini_profile.settings.setVisible(True)
        super().resizeEvent(event)

    def add_chat(self):
        self.num += 1
        self.chat_widget = ChatWidget(self.main_window, self.num)
        self.chat_list_layout.addWidget(self.chat_widget)
        messages_list = MessagesList()
        messages_list.top_chat_name.setText(self.chat_widget.chat_name.text())
        self.main_window.stack.addWidget(messages_list)

        # Добавляем виджет чата в список
        self.main_window.chat_widgets.append(self.chat_widget)
