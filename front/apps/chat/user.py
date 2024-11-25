from dialog import DialogWindow
from apps.chat.fields import HoverButton, DarkenButton
from PySide6.QtGui import QIcon, QCursor, QTransform
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QPushButton, QListWidgetItem)
from .style import MAIN_COLOR, HOVER_MAIN_COLOR, BG_COLOR


class User(QWidget):
    def __init__(self):
        super().__init__()
        
        self.setContentsMargins(0,5,0,5)

        self.avatar = QPushButton()
        self.avatar.setContentsMargins(0,0,0,0)
        self.avatar.setFixedSize(40, 40)
        self.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 20px;}''')
        self.avatar.setCursor(QCursor(Qt.PointingHandCursor))
        self.avatar.setIcon(QIcon('static/image/ava.png'))
        self.avatar.setIconSize(QSize(40, 40))

        self.profile_info_layout = QVBoxLayout()
        self.profile_info_layout.setSpacing(0)
        self.profile_info_layout.setContentsMargins(0,0,0,0)

        self.username = QLabel('NicnameVchate')
        self.username.setFixedHeight(15)
        self.username.setStyleSheet('''QLabel {background-color: rgba(0, 0, 0, 0); color: rgba(255, 255, 255, 1); font-weight: bold; font-size: 13px;}''')
        self.profile_info_layout.addWidget(self.username)

        self.user_id = QLabel('Nicname')
        self.user_id.setFixedHeight(15)
        self.user_id.setStyleSheet('''QLabel {background-color: rgba(0, 0, 0, 0); color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold;}''')
        self.profile_info_layout.addWidget(self.user_id)

        self.delit_user_btn = HoverButton(self, path='static/image/close')
        self.delit_user_btn.setContentsMargins(0,0,0,0)
        self.delit_user_btn.setFixedSize(30, 30)
        self.delit_user_btn.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0);}''')
        self.delit_user_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.delit_user_btn.setIcon(QIcon('static/image/close.png'))
        self.delit_user_btn.setIconSize(QSize(25, 25))

        self.data_layout = QHBoxLayout()
        self.data_layout.setSpacing(10)
        self.data_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.data_layout.setContentsMargins(0,0,0,0)

        self.data_layout.addWidget(self.avatar)
        self.data_layout.addLayout(self.profile_info_layout)
        self.data_layout.addWidget(self.delit_user_btn)
        self.setLayout(self.data_layout)
