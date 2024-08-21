from apps.chat.messages import MessagesList
from apps.chat.style import MAIN_BOX_COLOR, BG_COLOR
from window import Window
from PySide6.QtGui import QIcon, QCursor, QPixmap
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QScrollArea, QVBoxLayout, QLabel, QFrame,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QStackedWidget)
from apps.profile.profile import MiniProfile

class MainWindow(Window):
    '''Основное окно чата.'''
    def __init__(self) -> None:
        super(MainWindow, self).__init__()

        self.current_chat_index = None  # Хранит индекс текущего чата
        self.chat_widgets = []  # Список виджетов чатов

        # Добавляем виджеты в окно
        self.sidebar = Sidebar(self)
        self.main_layout.addWidget(self.sidebar)

        self.stack = QStackedWidget(self)
        self.main_layout.addWidget(self.stack)
        
        self.main_layout.addStretch()

    def switch_chat(self, index):
        # Сброс цвета фона предыдущего активного чата
        if self.current_chat_index is not None:
            prev_chat_widget = self.chat_widgets[self.current_chat_index]
            prev_chat_widget.chat_widget.setStyleSheet(
                '''QPushButton {border: none; background-color: none;} 
                   QPushButton:hover {background-color: #4a4a4a;}''')

        # Установка цвета фона для текущего активного чата
        current_chat_widget = self.chat_widgets[index]
        current_chat_widget.chat_widget.setStyleSheet(
            '''QPushButton {border-left: 5px solid rgba(123, 97, 255, 1); border-radius: 0px; background-color: rgba(255, 255, 255, 0.1);}
               QPushButton:hover {background-color: #4a4a4a; border-radius: 0px;}''')

        self.stack.setCurrentIndex(index)
        self.current_chat_index = index


class ChatWidget(QWidget):
    def __init__(self, main_window, num):
        super().__init__()
        self.main_window = main_window
        self.num = num
        layout = QHBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        chat_info = QWidget()
        chat_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')

        chat_info_layout = QVBoxLayout()
        chat_info_layout.setSpacing(0)
        chat_info_layout.setContentsMargins(0, 0, 0, 0)
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
        chat_avatar.setStyleSheet('''QPushButton {border: none; background-color: white; border-radius: 20px}''')
        chat_avatar.setIcon(QIcon('static/image/person.png'))  # Установите путь к вашему изображению
        chat_avatar.setIconSize(QSize(25, 25))

        chat_layout = QHBoxLayout()
        chat_layout.addWidget(chat_avatar)
        chat_layout.addWidget(chat_info)

        self.chat_widget = QPushButton()
        self.chat_widget.setContentsMargins(5, 0, 0, 0)
        self.chat_widget.setObjectName("chat_widget")
        self.chat_widget.setFixedHeight(60)
        self.chat_widget.setStyleSheet('''QPushButton {border:none; border-radius: 0px; background-color: none;} 
                                          QPushButton:hover {background-color: #4a4a4a; border-radius: 0px;}''')
        self.chat_widget.setCursor(QCursor(Qt.PointingHandCursor))
        # Подключаем сигнал с передачей индекса
        self.chat_widget.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
        self.chat_widget.setLayout(chat_layout)

        layout.addWidget(self.chat_widget)
        self.setLayout(layout)


class Sidebar(QWidget):
    '''Боковая панель с чатами, поиском и кнопкой добавления чатов.'''

    def __init__(self, main_window, parent=None):
        super().__init__(parent)
        self.main_window = main_window
        self.setMinimumSize(200, 600)
        self.setMaximumWidth(300)

        self.num = 0

        # Настройки Sidebar
        widget = QWidget()
        widget.setContentsMargins(0, 0, 0, 0)
        widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px; border: none;}}''')
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        # Основной слой
        self.sidebar_layout = QVBoxLayout()
        self.sidebar_layout.setContentsMargins(0, 0, 0, 0)
        self.sidebar_layout.setSpacing(13)

        self.chat_scroll = QScrollArea()
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

        self.new_chat_btn = QPushButton('  Создать чат')
        self.new_chat_btn.setFixedHeight(35)
        self.new_chat_btn.setIcon(QIcon('static/image/add.png'))  # Установите путь к вашему изображению
        self.new_chat_btn.setIconSize(QSize(16, 16))
        self.new_chat_btn.clicked.connect(self.add_chat)
        self.new_chat_btn.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
        self.new_chat_btn.setStyleSheet('''QPushButton {background-color: rgba(255, 255, 255, 0.1); color:rgba(255, 255, 255, 0.6); 
                                                        font-weight: bold; border:none; font-size: 11px;}
                                           QPushButton:hover{background-color: rgba(255, 255, 255, 0.4);}''')
        self.new_chat_btn.setCursor(QCursor(Qt.PointingHandCursor))

        chat_list_lable = QLabel('Chats')
        chat_list_lable.setFixedSize(40,10)
        chat_list_lable.setStyleSheet('''QLabel {color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold; padding-left: 2px;}''')

        top_sidebar = QVBoxLayout()
        top_sidebar.setContentsMargins(12, 12, 12, 0)

        # Добавляем виджеты
        top_sidebar.addLayout(serch_layout)
        top_sidebar.addWidget(self.new_chat_btn)
        top_sidebar.addWidget(chat_list_lable)
        self.sidebar_layout.addLayout(top_sidebar)
        self.sidebar_layout.addWidget(self.chat_scroll)

        widget.setLayout(self.sidebar_layout)

        layout.addWidget(widget)
        layout.addWidget(MiniProfile())
        self.setLayout(layout)

    def add_chat(self):
        self.num += 1
        chat_widget = ChatWidget(self.main_window, self.num)
        self.chat_list_layout.addWidget(chat_widget)
        self.main_window.stack.addWidget(MessagesList())

        # Добавляем виджет чата в список
        self.main_window.chat_widgets.append(chat_widget)

        print(f'Number of Widgets: {self.main_window.stack.count()}')
