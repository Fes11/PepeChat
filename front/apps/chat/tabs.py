from apps.chat.fields import FirstNewChatButton
from apps.chat.chat_list import Sidebar
from apps.chat.dialog import CreateChatDialog
from apps.chat.fields import DarkenButton
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QIcon, QCursor, QIcon, QCursor
from PySide6.QtWidgets import (QVBoxLayout,QHBoxLayout, QWidget, QPushButton, QLabel, QTextEdit, QLineEdit)
from .style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR


class TabsBar(QWidget):
    '''Окно находящееся справа, c вложениями, описанием, участниками чаков и тд.'''
    def __init__(self) -> None:
        super(TabsBar, self).__init__()

        self.setMinimumWidth(200)
        self.setMaximumWidth(300)
        self.setStyleSheet('color: white; font-weight: bold; font-size: 12px;')

        layout = QVBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0,0,0,0)

        widget = QWidget()
        widget.setStyleSheet(f'background-color: {MAIN_BOX_COLOR}; border-radius: 10px;')
        
        self.tabs_layout = QVBoxLayout()
        self.tabs_layout.setContentsMargins(15,15,15,15)

        self.menu_tabs = QHBoxLayout()
        self.menu_tabs.setContentsMargins(0,0,0,15)
        self.tabs_layout.addLayout(self.menu_tabs)

        self.main_tabs_btn = QPushButton('Main')
        self.main_tabs_btn.setFixedSize(60, 30)
        self.main_tabs_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; border-radius: 10px;}}
                                             QPushButton:hover {{background-color: {HOVER_MAIN_COLOR};}}''')
        self.main_tabs_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.main_tabs_btn.clicked.connect(self.open_main_tabs)
        self.menu_tabs.addWidget(self.main_tabs_btn)

        self.attachments_tabs_btn = QPushButton('Attachments')
        self.attachments_tabs_btn.setStyleSheet('''QPushButton {background-color: rgba(0,0,0,0.2); border-radius: 10px;}
                                                    QPushButton:hover {background-color: rgba(255,255,255, 0.3);}''')
        self.attachments_tabs_btn.setFixedSize(90, 30)
        self.attachments_tabs_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.attachments_tabs_btn.clicked.connect(self.open_attachments_tabs)
        self.menu_tabs.addWidget(self.attachments_tabs_btn)

        self.menu_tabs.addStretch()
        self.settings_tabs_btn = QPushButton()
        self.settings_tabs_btn.setFixedSize(24, 24)
        self.settings_tabs_btn.setStyleSheet(f'''background-color: rgba(0,0,0,0); border-radius: 15px;''')
        self.settings_tabs_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.settings_tabs_btn.setIcon(QIcon('static/image/settings.png'))
        self.settings_tabs_btn.setIconSize(QSize(24, 24))
        self.settings_tabs_btn.clicked.connect(self.open_settings_tabs)
        self.menu_tabs.addWidget(self.settings_tabs_btn)

        self.tabs_layout.addWidget(MainTabs())

        self.tabs_layout.addStretch()
        widget.setLayout(self.tabs_layout)

        layout.addWidget(widget)
        self.setLayout(layout)
    
    def open_main_tabs(self):
        pass
    
    def open_attachments_tabs(self):
        pass

    def open_settings_tabs(self):
        pass

class MainTabs(QWidget):
    '''Основной блок с описанием и участниками. '''
    def __init__(self) -> None:
        super(MainTabs, self).__init__()

        self.setStyleSheet('background-color: rgba(0,0,0,0);')

        description_widget = QWidget()
        description_widget.setFixedHeight(75)

        layout = QVBoxLayout()
        layout.setSpacing(15)
        layout.setContentsMargins(0,0,0,0)
        
        description_layout = QHBoxLayout()
        description_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        description_layout.setSpacing(5)
        description_layout.setContentsMargins(0,0,0,0)

        self.chat_image = DarkenButton(75)
        self.chat_image.setCursor(QCursor(Qt.PointingHandCursor))
        self.chat_image.setFixedSize(75, 75)
        description_layout.addWidget(self.chat_image)

        description_text_layout = QVBoxLayout()
        description_text_layout.setAlignment(Qt.AlignmentFlag.AlignVCenter)
        description_text_layout.setSpacing(0)
        description_text_layout.setContentsMargins(0,0,0,0)

        self.name_chat = QLabel('Name Chat')
        self.name_chat.setStyleSheet('padding-left: 2px; font-size: 16px;')
        self.name_chat.setFixedHeight(20)
        description_text_layout.addWidget(self.name_chat)

        self.description = QTextEdit('Здесь должно быть описание группы...')
        self.description.setContentsMargins(0,0,0,0)
        self.description.setFixedSize(150, 50)
        self.description.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 13px;')
        description_text_layout.addWidget(self.description)

        description_layout.addLayout(description_text_layout)

        description_widget.setLayout(description_layout)
        layout.addWidget(description_widget)

        self.link = Links()
        self.link.setStyleSheet('background-color: rgba(255,255,255, 0.1); border-radius: 20px;')
        layout.addWidget(self.link)

        self.online_label = QLabel('Online - 4')
        self.online_label.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 12px; padding-left: 2px;')
        layout.addWidget(self.online_label)

        layout.addStretch()
        self.setLayout(layout)


class AttachmentsTabs(QWidget):
    '''Вложения.'''
    def __init__(self) -> None:
        super(AttachmentsTabs, self).__init__()


class SettingsTabs(QWidget):
    '''Настройки чатов.'''
    def __init__(self) -> None:
        super(SettingsTabs, self).__init__()


class Links(QWidget):
    def __init__(self) -> None:
        super(Links, self).__init__()

        layout = QHBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0,0,0,0)

        self.link = QLineEdit('@sad/dssdgsv/xv')
        self.link.setStyleSheet('padding: 10px; font-size: 12px;')
        self.link.setFixedSize(230, 40)
        layout.addWidget(self.link)

        self.link_btn = QPushButton('Copy link')
        self.link_btn.setFixedSize(100, 40)
        self.link_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.link_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; border-radius: 20px; font-size: 13px;}}
                                        QPushButton:hover {{background-color: {HOVER_MAIN_COLOR};}}''')
        layout.addWidget(self.link_btn)

        self.setLayout(layout)