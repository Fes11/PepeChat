import re
from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor, QPixmap, QColor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QApplication, QGraphicsDropShadowEffect, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)

from apps.chat.fields import PlainTextEdit, HoverButton
from apps.chat.style import MAIN_COLOR, MAIN_BOX_COLOR, BG_COLOR, TEXT_COLOR, HOVER_MAIN_COLOR
from apps.chat.messages import Message
from apps.chat.input_panel import InputPanel
from apps.chat.tabs import TabsBar
from image import get_rounds_edges_image

class MessagesList(QWidget):
    def __init__(self, parent, main_window, orig_window, chat_model, tabs_bar_visible) -> None:
        super(MessagesList, self).__init__()
        self.parent = parent
        self.orig_window = orig_window
        self.main_window = main_window
        self.chat_model = chat_model
        self.messages = []

        self.tabs_bar_visible = tabs_bar_visible

        self.setContentsMargins(0,0,0,0)
        self.setMinimumWidth(500)

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

        SIZE_AVATAR = 45
        SIZE_AVATAR_WIDGET = 45
        iamge_chat = QPushButton()
        original_pixmap = QPixmap(self.chat_model.avatar_path)
        iamge_chat.setFixedSize(SIZE_AVATAR_WIDGET, SIZE_AVATAR_WIDGET)
        iamge_chat.setStyleSheet(f'''QPushButton {{border: none; background-color: rgba(0,0,0,0);}}''')

        if self.chat_model.chat_type == 'group':
            iamge_chat.setIcon(QIcon(get_rounds_edges_image(self, original_pixmap, 20))) 
        else:
            iamge_chat.setIcon(QIcon(get_rounds_edges_image(self, original_pixmap, SIZE_AVATAR_WIDGET)))  # Установите путь к вашему изображению

        iamge_chat.setIconSize(QSize(SIZE_AVATAR, SIZE_AVATAR))

        top_chat_panel_layout.addWidget(iamge_chat)

        self.top_chat_name = QLabel(self.chat_model.chat_name)
        self.top_chat_name.setFixedHeight(14)
        self.top_chat_name.setStyleSheet('''background-color: rgba(0,0,0,0); font-size: 13px; font-weight: bold; color: white; border: none;''')

        top_chat_name_layout = QVBoxLayout()
        top_chat_name_layout.setSpacing(0)
        top_chat_name_layout.addWidget(self.top_chat_name)

        self.online_layout = QHBoxLayout()
        self.online_layout.setSpacing(5)


        if self.chat_model.online:
            self.glow = QGraphicsDropShadowEffect(self)
            self.glow.setBlurRadius(20)  # радиус размытия
            rgba = list(map(int, re.findall(r'\d+', MAIN_COLOR)))
            color = QColor(rgba[0], rgba[1], rgba[2])
            self.glow.setColor(color)  # цвет свечения
            self.glow.setOffset(0, 0)  # смещение тени
            
            self.sensor_online = QWidget()
            self.sensor_online.setContentsMargins(0,0,0,0)
            self.sensor_online.setFixedSize(10,10)
            self.sensor_online.setStyleSheet(f'''background-color: {MAIN_COLOR}; border-radius: 5px;''')

            self.sensor_online.setGraphicsEffect(self.glow)

            self.online_label = QLabel('Online: 4')
            if self.chat_model.chat_type == 'group':
                self.online_label.setText('Online: 4')
            else:
                self.online_label.setText('Online')
            self.online_label.setFixedHeight(13)
            self.online_label.setStyleSheet('''border: none; background-color: rgba(0,0,0,0); color: rgba(255,255,255, 0.2); 
                                               font-weight: bold; padding-bottom: 3px;''')

            self.online_layout.addWidget(self.sensor_online)
            self.online_layout.addWidget(self.online_label)
        else:
            self.sensor_online = QWidget()
            self.sensor_online.setContentsMargins(0,0,0,0)
            self.sensor_online.setFixedSize(10,10)
            self.sensor_online.setStyleSheet(f'''background-color: {BG_COLOR}; border-radius: 5px;''')

            self.online_label = QLabel('Ofline')
            self.online_label.setFixedHeight(13)
            self.online_label.setStyleSheet('''border: none; background-color: rgba(0,0,0,0); color: rgba(255,255,255, 0.2); 
                                               font-weight: bold; padding-bottom: 3px;''')

            self.online_layout.addWidget(self.sensor_online)
            self.online_layout.addWidget(self.online_label)
        

        top_chat_name_layout.addLayout(self.online_layout)
        top_chat_panel_layout.addLayout(top_chat_name_layout)

        top_chat_panel_layout.addStretch()

        self.tabs_bar_btn = HoverButton(self, 'static/image/paper-clip')
        self.tabs_bar_btn.setFixedSize(30,30)
        self.tabs_bar_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.tabs_bar_btn.setStyleSheet('''background-color: rgba(0,0,0,0); border-radius: 15px; border: none;''')
        self.tabs_bar_btn.setIconSize(QSize(25, 25)) 
        self.tabs_bar_btn.clicked.connect(self.parent.toggle_tabs_bar)
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
        self.tabs_bar.setVisible(self.tabs_bar_visible)

        layout.addLayout(chat_layout)
        layout.addWidget(self.tabs_bar)
        self.setLayout(layout)
    
    def resizeEvent(self, event: QtCore.QEvent) -> None:
        align_left = self.width() > 1350

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

    def hide_task_bars(self, visible):
        """Обновить видимость TabsBar."""
        self.tabs_bar.setVisible(visible)
        