from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor, QPixmap
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)

from apps.chat.fields import PlainTextEdit, HoverButton
from apps.chat.style import MAIN_COLOR, MAIN_BOX_COLOR, NOT_USER_BUBLS, TEXT_COLOR, HOVER_MAIN_COLOR
from apps.chat.messages import Message
from apps.chat.input_panel import InputPanel
from apps.chat.tabs import TabsBar
from image import get_rounds_edges_image

class MessagesList(QWidget):
    def __init__(self, main_window, orig_window, chat_model) -> None:
        super(MessagesList, self).__init__()

        self.orig_window = orig_window
        self.main_window = main_window
        self.chat_model = chat_model
        self.messages = []

        self.setContentsMargins(0,0,0,0)
        self.setMinimumWidth(550)

        self.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0); border: none;}''')

        # Для добавления файлов
        self.file_list = QListWidget()

        layout = QHBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        chat_layout = QVBoxLayout()
        chat_layout.setSpacing(0)
        chat_layout.setContentsMargins(0,0,0,0)

        # Верхняя панель чата
        top_chat_panel = QWidget()
        top_chat_panel.setMinimumHeight(60)
        top_chat_panel.setStyleSheet(f'''background-color: {MAIN_BOX_COLOR}; border-bottom: 1px solid rgba(255,255,255, 0.1);
                                         border-top-left-radius: 10px;
                                         border-top-right-radius: 10px;
                                         border-bottom-left-radius: 0px;
                                         border-bottom-right-radius: 0px;''')

        top_chat_panel_layout = QHBoxLayout()
        top_chat_panel_layout.setSpacing(10)
        top_chat_panel_layout.setContentsMargins(10,0,10,0)

        iamge_chat = QPushButton()
        original_pixmap = QPixmap(self.chat_model.avatar_path)
        iamge_chat.setIcon(QIcon(get_rounds_edges_image(self, original_pixmap)))  # Установите путь к вашему изображению
        iamge_chat.setIconSize(QSize(40, 40))
        iamge_chat.setFixedSize(40,40)
        iamge_chat.setStyleSheet('''background: white; border: none; border-radius: 10px;''')
        top_chat_panel_layout.addWidget(iamge_chat)

        self.top_chat_name = QLabel(self.chat_model.chat_name)
        self.top_chat_name.setStyleSheet('''background-color: rgba(0,0,0,0); font-size: 13px; font-weight: bold; color: white; border: none;''')
        top_chat_panel_layout.addWidget(self.top_chat_name)

        top_chat_panel_layout.addStretch()

        self.tabs_bar_btn = HoverButton(self, 'static/image/paper-clip')
        self.tabs_bar_btn.setFixedSize(30,30)
        self.tabs_bar_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.tabs_bar_btn.setStyleSheet('''background-color: rgba(0,0,0,0); border-radius: 15px; border: none;''')
        self.tabs_bar_btn.setIconSize(QSize(25, 25)) 
        self.tabs_bar_btn.clicked.connect(self.hide_task_bars)
        top_chat_panel_layout.addWidget(self.tabs_bar_btn)

        top_chat_panel.setLayout(top_chat_panel_layout)
        chat_layout.addWidget(top_chat_panel)
    
        # Поле на котором выводятся сообщения
        self.scroll_area = QScrollArea(self)
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.scroll_area.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border:none;}}''')

        self.chat_area = QWidget(self)
        self.chat_area.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0);}''')

        self.chat_area_layout = QVBoxLayout()
        self.chat_area_layout.addStretch()

        self.open_lable = QLabel('Здесь пока нет сообщений...')
        self.open_lable.setAlignment(Qt.AlignCenter)
        self.open_lable.setStyleSheet('''QLabel {background-color: rgba(0,0,0,0); color: grey; font-size:14px; margin-bottom: 10px;}''')
        self.chat_area_layout.addWidget(self.open_lable)

        self.scroll_area.setWidget(self.chat_area)

        self.chat_area.setLayout(self.chat_area_layout)
        
        self.input_panel = InputPanel(self.file_list, self)

        # Добавляем в основной chat_layout
        chat_layout.addWidget(self.scroll_area)
        chat_layout.addWidget(self.input_panel)

        self.tabs_bar = TabsBar(self.chat_model)
        self.tabs_bar.setVisible(False)

        layout.addLayout(chat_layout)
        layout.addWidget(self.tabs_bar)
        self.setLayout(layout)
    
    def resizeEvent(self, event: QtCore.QEvent) -> None:
        align_left = self.width() > 1200

        for message in self.messages:
            message.set_alignment(align_left)

        return super().resizeEvent(event)
    
    def add_message(self, text, i, path=''):
        if self.open_lable.isVisible():
            self.open_lable.setVisible(False)
        
        self.message = Message(text, i, path)

        self.messages.append(self.message) 
        self.chat_area_layout.addLayout(self.message)
        
        QtCore.QTimer.singleShot(0, self.scrollToBottom)

        if self.width() > 1200:
            self.message.set_alignment(True)

    def scrollToBottom(self):
        QApplication.processEvents()
        self.scroll_area.verticalScrollBar().setValue(self.scroll_area.verticalScrollBar().maximum())

    def hide_task_bars(self):
        if self.tabs_bar.isVisible():
            self.tabs_bar.setVisible(False)
            if not self.orig_window.full_sreen:
                self.orig_window.resize(self.orig_window.width() - 300, self.orig_window.height())
        else:
            self.tabs_bar.setVisible(True)
            if not self.orig_window.full_sreen:
                self.orig_window.resize(self.orig_window.width() + 300, self.orig_window.height())
