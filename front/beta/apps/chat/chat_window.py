from apps.chat.messages import MessagesList
from apps.chat.style import MAIN_BOX_COLOR, BG_COLOR
from window import Window
from datetime import datetime
from PySide6.QtGui import QIcon, QCursor, QPixmap, QColor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget, QLineEdit, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QStackedWidget, QGraphicsBlurEffect)
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
        
        self.box = AddChatDialog(self)
    
    def open_add_chat(self):
        self.box.setVisible(True)
        self.box.raise_()
        
    def resizeEvent(self, event):
        self.box.setGeometry(0, 30, self.width(), self.height()-30)
        super().resizeEvent(event)

    def switch_chat(self, index):
        # Сброс цвета фона предыдущего активного чата
        if self.current_chat_index is not None:
            prev_chat_widget = self.chat_widgets[self.current_chat_index]
            prev_chat_widget.chat_widget.setStyleSheet(
                '''QPushButton {border: none; background-color: none;} 
                   QPushButton:hover {background-color: rgba(0,0,0, 0.2);}''')

        # Установка цвета фона для текущего активного чата
        current_chat_widget = self.chat_widgets[index]
        current_chat_widget.chat_widget.setStyleSheet(
            '''QPushButton {border-left: 5px solid rgba(123, 97, 255, 1); border-radius: 0px; background-color: rgba(255, 255, 255, 0.1);}
               QPushButton:hover {background-color: rgba(0,0,0, 0.2); border-radius: 0px;}''')

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

        self.chat_info_layout = QVBoxLayout()
        self.chat_info_layout.setSpacing(0)
        self.chat_info_layout.setContentsMargins(0, 0, 0, 0)
        chat_info.setLayout(self.chat_info_layout)

        self.chat_name = QLabel(f'Название чата {num}')
        self.chat_name.setMaximumHeight(50)
        self.chat_name.setStyleSheet('''QLabel {background-color: rgba(0, 0, 0, 0); font-weight: bold; font-size: 13px;}''')
        self.chat_info_layout.addWidget(self.chat_name)

        last_message = QLabel('Сообщение...')
        last_message.setMaximumHeight(50)
        last_message.setStyleSheet('''QLabel {color: #b5b5b5;}''')
        self.chat_info_layout.addWidget(last_message)

        chat_avatar = QPushButton()
        chat_avatar.setFixedSize(40, 40)
        chat_avatar.setStyleSheet('''QPushButton {border: none; background-color: white; border-radius: 20px}''')
        chat_avatar.setIcon(QIcon('static/image/person.png'))  # Установите путь к вашему изображению
        chat_avatar.setIconSize(QSize(25, 25))

        self.chat_time_layout = QVBoxLayout()
        self.chat_time_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.chat_time_layout.setSpacing(8)
        self.chat_time_layout.setContentsMargins(0,0,0,0)

        chat_time = QLabel(datetime.now().strftime('%H:%M'))
        chat_time.setStyleSheet('QLabel {color: rgba(169, 171, 173, 1); background: rgba(0, 0, 0, 0);}')

        # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
        glow = QGraphicsDropShadowEffect(self)
        glow.setBlurRadius(20)  # радиус размытия
        glow.setColor(QColor(123, 97, 255))  # цвет свечения
        glow.setOffset(0, 0)  # смещение тени
        
        new_mess = QLabel('1')
        new_mess.setContentsMargins(0,0,0,0)
        new_mess.setAlignment(Qt.AlignmentFlag.AlignCenter)
        new_mess.setFixedSize(16,16)
        new_mess.setStyleSheet('''QLabel {background-color:rgba(123, 97, 255, 1); color: white; border-radius: 8px;
                                         font-weight: bold; font-size: 10px;}''')
        # Применение эффекта к new_mess
        new_mess.setGraphicsEffect(glow)
        
        new_mess_layout = QHBoxLayout()
        new_mess_layout.setAlignment(Qt.AlignmentFlag.AlignRight)
        new_mess_layout.addWidget(new_mess)

        self.chat_time_layout.addWidget(chat_time)
        self.chat_time_layout.addLayout(new_mess_layout)

        self.chat_layout = QHBoxLayout()
        self.chat_layout.addWidget(chat_avatar)
        self.chat_layout.addWidget(chat_info)
        self.chat_layout.addStretch()
        self.chat_layout.addLayout(self.chat_time_layout)

        self.chat_widget = QPushButton()
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

        # if self.size().width() < 650:
        #     self.chat_name.hide()
        #     chat_time.hide()
        #     new_mess.hide()
        #     last_message.hide()


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

        # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
        glow = QGraphicsDropShadowEffect(self)
        glow.setBlurRadius(20)  # радиус размытия
        glow.setColor(QColor(123, 97, 255))  # цвет свечения
        glow.setOffset(0, 0)  # смещение тени
        logo.setGraphicsEffect(glow)

        serch_layout.addWidget(logo)
        serch_layout.addWidget(self.serch)

        self.new_chat_btn = QPushButton('  Создать чат')
        self.new_chat_btn.setFixedHeight(35)
        self.new_chat_btn.setIcon(QIcon('static/image/add.png'))  # Установите путь к вашему изображению
        self.new_chat_btn.setIconSize(QSize(16, 16))
        self.new_chat_btn.clicked.connect(self.add_chat)
        self.new_chat_btn.clicked.connect(self.main_window.open_add_chat)
        self.new_chat_btn.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
        self.new_chat_btn.setStyleSheet('''QPushButton {background-color: rgba(255, 255, 255, 0.1); color:rgba(255, 255, 255, 0.6); 
                                                        font-weight: bold; border:none; font-size: 11px; border-radius: 10px;}
                                           QPushButton:hover{background-color: rgba(255, 255, 255, 0.2);}''')
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
        self.chat_widget = ChatWidget(self.main_window, self.num)
        self.chat_list_layout.addWidget(self.chat_widget)
        self.main_window.stack.addWidget(MessagesList())

        # Добавляем виджет чата в список
        self.main_window.chat_widgets.append(self.chat_widget)


class AddChatDialog(QPushButton):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setVisible(False)
        
        main_layout = QVBoxLayout()
        main_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.background = QPushButton()
        self.background.clicked.connect(self.close_add_chat)
        self.background.setStyleSheet('background: rgba(0, 0, 0, 0.5); border: none;')
        
        main_widget = QWidget()
        main_widget.setFixedSize(400, 500)
        main_widget.setStyleSheet(f'''QWidget {{background: #333333; color: white; border-radius: 10px; font-size: 13px;}}
                                    QTextEdit {{background: {MAIN_BOX_COLOR}; padding-top: 7px; padding-left: 8px;}}
                                    QPushButton {{background: {MAIN_BOX_COLOR};}}
                                    QPushButton:hover {{background: rgba(255,255,255, 0.3);}}''')
        main_layout.addWidget(main_widget)
        
        layout = QVBoxLayout()
        layout.addWidget(self.background)
        
        form_layout = QVBoxLayout()
        form_layout.setContentsMargins(20,20,20,20)
        
        close_btn = QPushButton()
        close_btn.setIcon(QIcon('static/image/close_hover.png'))  # Установите путь к вашему изображению
        close_btn.setIconSize(QSize(25, 25))
        close_btn.setFixedSize(30, 30)
        close_btn.setCursor(QCursor(Qt.PointingHandCursor))
        close_btn.clicked.connect(self.close_add_chat)
        form_layout.addWidget(close_btn)
        
        iamge = QPushButton()
        iamge.setIcon(QIcon('static/image/ava3.jpg'))  # Установите путь к вашему изображению
        iamge.setIconSize(QSize(140, 140))
        iamge.setFixedSize(150, 150)
        iamge.setCursor(QCursor(Qt.PointingHandCursor))
        form_layout.addWidget(iamge)
        
        name_chat = QTextEdit()
        name_chat.setFixedHeight(40)
        name_chat.setPlaceholderText("Введите название чата...")
        form_layout.addWidget(name_chat)
        
        searc_people = QTextEdit()
        searc_people.setFixedHeight(40)
        searc_people.setPlaceholderText("Добавте участников...")
        form_layout.addWidget(searc_people)
        
        user_list = QStackedWidget()
        user_list.setStyleSheet(f'background: {MAIN_BOX_COLOR}; border: 1px solid rgba(0,0,0, 0.3)')
        form_layout.addWidget(user_list)
        
        create_btn = QPushButton('Создать')
        create_btn.setFixedHeight(50)
        create_btn.setCursor(QCursor(Qt.PointingHandCursor))
        form_layout.addWidget(create_btn)
        
        main_widget.setLayout(form_layout)
        
        layout.addLayout(main_layout)
        self.setLayout(layout)
    
    def close_add_chat(self):
        self.setVisible(False)
    
    def resizeEvent(self, event):
        self.background.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)
        
