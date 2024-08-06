"""
    Window главный класс всех окон
    MainWindow Singleton
    Анимации в отдельном файле
    Messages сделать фабрикой?
    Chat тоже фабрика?
    Задача для gpt: разбей этот код на отдельные файлы по всем правилам ООП и используя паттерны проектирования
"""

from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtWidgets, QtGui, QtCore
from PySide6.QtGui import QFontMetrics, QIcon, QCursor, QPixmap
from PySide6.QtCore import Qt, QPropertyAnimation, QPropertyAnimation, QParallelAnimationGroup, QPoint, QSize
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QMainWindow,
                               QGraphicsOpacityEffect, QFileDialog, QListWidget, QLineEdit, QGridLayout)

from apps.chat.style import scroll_style
from apps.chat.fields import WrapLabel

BG_COLOR = '#1e1b13'
MAIN_BOX_COLOR = '#262626'

class MainWindow(QMainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()
        
        # Базовые настройки MainWindow
        self.setWindowTitle("My App")
        self.setMinimumSize(700, 600)
        self.setStyleSheet(scroll_style)   
        
        # Для добавления файлов
        self.file_list = QListWidget(self)

        # Убирает стандартные рамки окна
        self.setAutoFillBackground(False)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)

        # Основной виджет в который добавляються все остальные слои
        self.main = QWidget()
        self.main.setGeometry(0, 0, self.width(), self.height())
        self.main.setStyleSheet(f'''QWidget {{background-color: {BG_COLOR};}}''')

        self.window_layout = QVBoxLayout()
        self.window_layout.setContentsMargins(0,0,0,0)
        self.window_layout.setSpacing(0)

        # Основной layout в который добавляються все остальные слои
        self.main_layout = QHBoxLayout()
        self.main_layout.setContentsMargins(7, 7, 7, 7)
        self.main_layout.setSpacing(5)

        # Боковая панель
        self.sidebar = QWidget()
        self.sidebar.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px}}''')
        self.setMinimumWidth(180)
        self.sidebar.setMaximumWidth(250)
        self.sidebar_layout = QVBoxLayout()
        self.sidebar_layout.setSpacing(10)

        self.chat_list = QScrollArea()
        self.chat_list.setWidgetResizable(True)
        self.chat_list.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.chat_list.setStyleSheet('''QScrollArea {border: none;}''')

        self.chat_list_layout = QVBoxLayout()
        self.chat_list_layout.setContentsMargins(0,0,0,0)
        self.chat_list_layout.setSpacing(0)
        self.chat_list_layout.setAlignment(Qt.Alignment.AlignTop)

        self.chat = QWidget()
        self.chat.setLayout(self.chat_list_layout)

        self.chat_list.setWidget(self.chat)

        # Поиск 
        self.serch = QTextEdit()
        self.serch.setMaximumHeight(35)
        self.serch.setPlaceholderText("Поиск...")
        self.serch.setStyleSheet('''QTextEdit {background-color: #1e1b13; color: white; border-radius: 16px; padding: 5px 0 5px 10px;}''')

        self.sidebar_layout.addWidget(self.serch)

        self.new_chat_btn = QPushButton('Начать новый чат \n +')
        self.new_chat_btn.clicked.connect(self.add_chat)
        self.new_chat_btn.setStyleSheet('''QPushButton {background-color: #4a4a4a; color:white; border:none; padding: 5px;}
                                           QPushButton:hover{background-color: grey;}''')
        self.new_chat_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.sidebar_layout.addWidget(self.new_chat_btn)

        
        self.sidebar_layout.addWidget(self.chat_list)
        self.sidebar.setLayout(self.sidebar_layout)
        self.main_layout.addWidget(self.sidebar)

        # Кнопка закрытия окна
        self.close_btn = QPushButton('X')
        self.close_btn.clicked.connect(self.close)
        self.close_btn.setFixedSize(50, 30)
        self.close_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.close_btn.setStyleSheet('''QPushButton {color: white; border: none;}
                                        QPushButton:hover {background-color: #fd5858;}''')

        # Кнопка сворачивания окна
        self.hide_btn = QPushButton('_')
        self.hide_btn.clicked.connect(self.showMinimized)
        self.hide_btn.setFixedSize(50, 30)
        self.hide_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.hide_btn.setStyleSheet('''QPushButton {color: white; border: none;}
                                       QPushButton:hover {background-color: grey;}''')

        # Верхняя панель
        self.top_panel_layout = QHBoxLayout()
        self.top_panel_layout.setContentsMargins(0,0,0,0)
        self.top_panel_layout.setSpacing(0)
        self.top_panel_layout.addStretch()
        self.top_panel_layout.addWidget(self.hide_btn)
        self.top_panel_layout.addWidget(self.close_btn)

        self.top_panel = QWidget()
        self.top_panel.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR};}}''')
        self.top_panel.setFixedHeight(30)
        self.top_panel.setLayout(self.top_panel_layout)

        # Перетаскивание при зажатии верхней панели
        self.top_panel.mousePressEvent = self.topPanelMousePressEvent
        self.top_panel.mouseMoveEvent = self.topPanelMouseMoveEvent

        self.window_layout.addWidget(self.top_panel) # Добавляем в основной layout

        self.chat_layout = QVBoxLayout()

        # Поле на котором выводятся сообщения
        self.scroll_area = QScrollArea()
        self.scroll_area.setMinimumWidth(400)
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.scroll_area.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border:none; border-radius: 10px;}}''')

        self.text = QWidget(self)
        self.text_layout = QVBoxLayout()
        self.text_layout.addStretch()

        self.open_lable = QLabel('Здесь пока нет сообщений...')
        self.open_lable.setAlignment(Qt.AlignCenter)
        self.open_lable.setStyleSheet('''QLabel {color: grey; font-size:14px; margin-bottom: 10px;}''')
        self.text_layout.addWidget(self.open_lable)

        self.scroll_area.setWidget(self.text)

        self.text.setLayout(self.text_layout)
        self.chat_layout.addWidget(self.scroll_area) # Добавляем в основной chat_layout

        # Поле ввода сообщения
        self.message_input = QTextEdit()
        self.message_input.installEventFilter(self)
        self.message_input.setPlaceholderText("Напишите сообщение...")
        self.message_input.setMinimumWidth(400)
        self.message_input.setMaximumWidth(700)
        self.message_input.setFixedHeight(40)
        self.message_input.setStyleSheet('''QTextEdit {color: white; 
                                            border-radius: 10px; 
                                            padding: 8px 0 0 10px; 
                                            background-color: #4a4a4a; 
                                            font-weight: bold;}''')
        # Кнопка для отправки сообщения
        self.send_message_btn = QPushButton(self)
        self.send_message_btn.setMaximumSize(80, 40)
        self.send_message_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_message_btn.setStyleSheet('''QPushButton {background-color: #9f63ab; border-radius: 10px; padding: 10px; font-weight: bold;}
                                               QPushButton:hover {background-color: #c67cd5;}''')
        self.send_message_btn.setIcon(QIcon('media/image/send.png'))  # Установите путь к вашему изображению
        self.send_message_btn.setIconSize(QSize(24, 24))
        self.send_message_btn.clicked.connect(self.send_message)

        # Кнопка для отправки файлов
        self.send_file = QPushButton()
        self.send_file.setFixedSize(45, 40)
        self.send_file.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_file.setStyleSheet('''QPushButton {background-color: #9f63ab; border-radius: 10px; padding: 5px;}
                                        QPushButton:hover {background-color: #c67cd5;}''')
        self.send_file.setIcon(QIcon('media/image/paper-clip.png'))  # Установите путь к вашему изображению
        self.send_file.setIconSize(QSize(24, 24))
        self.send_file.clicked.connect(self.open_file_dialog)

        # Слой панели для ввода
        self.input_layout = QHBoxLayout()
        self.input_layout.addStretch()
        self.input_layout.addWidget(self.send_file)
        self.input_layout.addWidget(self.message_input)
        self.input_layout.addWidget(self.send_message_btn)

        # Панель ввода
        self.input_panel = QWidget()
        self.input_panel.setFixedHeight(60)
        self.input_panel.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px;}}''')
        self.input_panel.setLayout(self.input_layout)
        self.chat_layout.addWidget(self.input_panel) # Добавляем в основной chat_layout

        self.main.setLayout(self.window_layout)
        self.main_layout.addLayout(self.chat_layout)
        self.window_layout.addLayout(self.main_layout)
        
        self.setCentralWidget(self.main)

    def add_message(self, text, i):
        if self.open_lable.isVisible():
                self.open_lable.setVisible(False)
        mes_avatar = QPushButton()
        mes_avatar.setFixedSize(30, 30)
        mes_avatar.setStyleSheet('''QPushButton {background-color: white; border-radius: 15px}''')
        mes_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        mes_avatar.setIcon(QIcon('media/image/person.png'))  # Установите путь к вашему изображению
        mes_avatar.setIconSize(QSize(20, 20))

        message = WrapLabel(text)
        message_bubble = QWidget()
        message_bubble.setContentsMargins(0,0,0,0)
        message_buble_layout = QHBoxLayout()
        message_buble_layout.setSpacing(0)
        message_buble_layout.setContentsMargins(0,0,0,0)
        message_buble_layout.addWidget(message)

        # Метка времени
        mes_time = QLabel(datetime.now().strftime('%H:%M'))
        mes_time.setStyleSheet('QLabel { color: white; }')
        message_buble_layout.addWidget(mes_time)

        message_bubble.setLayout(message_buble_layout)
 
        self.message_layout = QHBoxLayout()
        self.text_layout.addLayout(self.message_layout)

        if i % 2:
            message_bubble.setStyleSheet('''
                    QWidget {
                        border-radius: 8px;
                        background: #6b6b6b;
                        padding: 10px;
                    }
                ''')
            self.message_layout.addStretch()
            self.message_layout.addWidget(message_bubble)
            self.message_layout.addWidget(mes_avatar)
        else:
            message_bubble.setStyleSheet('''
                    QWidget {
                        border-radius: 8px;
                        background: #545454;
                        padding: 10px;
                    }
                ''')
            self.message_layout.addWidget(mes_avatar)
            self.message_layout.addWidget(message_bubble)
            self.message_layout.addStretch()
        
        QtCore.QTimer.singleShot(0, self.scrollToBottom)

    def send_message(self):
        text = self.message_input.toPlainText()
        if text:
            self.add_message(text , randrange(0, 2))
            self.message_input.clear()

    def scrollToBottom(self):
        QApplication.processEvents()
        self.scroll_area.verticalScrollBar().setValue(self.scroll_area.verticalScrollBar().maximum())
    
    def resizeEvent(self, event):
        self.main.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)
    
    def add_chat(self):
        chat_info = QWidget()
        chat_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')
        chat_info_layout = QVBoxLayout()
        chat_info_layout.setSpacing(0)
        chat_info_layout.setContentsMargins(0,0,0,0)
        chat_info.setLayout(chat_info_layout)

        chat_name = QLabel('Название чата')
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
        chat_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        chat_avatar.setIcon(QIcon('media/image/person.png'))  # Установите путь к вашему изображению
        chat_avatar.setIconSize(QSize(25, 25))

        chat_layout = QHBoxLayout()
        chat_layout.addWidget(chat_avatar)
        chat_layout.addWidget(chat_info)

        chat_widget = QWidget()
        chat_widget.setFixedHeight(60)
        chat_widget.setStyleSheet('''QWidget:hover {background-color: #4a4a4a;}''')
        chat_widget.setCursor(QCursor(Qt.PointingHandCursor))
        chat_widget.setLayout(chat_layout)

        self.chat_list_layout.addWidget(chat_widget)

    def topPanelMousePressEvent(self, event):
        self.oldPos = event.globalPosition().toPoint()

    def topPanelMouseMoveEvent(self, event):
        try:
            delta = event.globalPosition().toPoint() - self.oldPos
            self.move(self.x() + delta.x(), self.y() + delta.y())
            self.oldPos = event.globalPosition().toPoint()
        except AttributeError:
            pass
    
    def eventFilter(self, obj, event):
        if event.type() == QtCore.QEvent.KeyPress and obj is self.message_input:
            if event.key() == QtCore.Qt.Key_Return and self.message_input.hasFocus():
                self.send_message()
        return super().eventFilter(obj, event)
    
    def open_file_dialog(self):
        dialog = QFileDialog(self)
        dialog.setFileMode(QFileDialog.FileMode.ExistingFiles)
        dialog.setNameFilter("Images (*.png *.jpg)")
        dialog.setViewMode(QFileDialog.ViewMode.List)
        if dialog.exec():
            filenames = dialog.selectedFiles()
            if filenames:
                self.file_list.addItems([str(Path(filename)) for filename in filenames])
