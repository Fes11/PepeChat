from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)

from apps.chat.fields import WrapLabel
from apps.chat.style import send_btn_style, MAIN_BOX_COLOR


class MiniProfile(QWidget):
    def __init__(self):
        super(MiniProfile, self).__init__()
        self.setContentsMargins(0,0,0,0)
        self.setFixedHeight(60)

        layout = QHBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        widget = QWidget()
        widget.setMinimumWidth(200)
        widget.setMaximumWidth(300)
        widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px;}}''')

        main_layout = QHBoxLayout()
        main_layout.setContentsMargins(15,7,7,7)

        avatar = QPushButton()
        avatar.setFixedSize(40, 40)
        avatar.setStyleSheet('''QPushButton {border-radius: 20px}''')
        avatar.setCursor(QCursor(Qt.PointingHandCursor))
        avatar.setIcon(QIcon('static/image/ava.png'))  # Установите путь к вашему изображению
        avatar.setIconSize(QSize(40, 40))

        profile_info = QWidget()
        profile_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')
        profile_info_layout = QVBoxLayout()
        profile_info_layout.setSpacing(0)
        profile_info_layout.setContentsMargins(0,0,0,0)
        profile_info.setLayout(profile_info_layout)

        username = QLabel('Nicname')
        username.setMaximumHeight(50)
        username.setStyleSheet('''QLabel {font-weight: bold; font-size: 13px;}''')
        profile_info_layout.addWidget(username)

        user_id = QLabel('@kyrlk')
        user_id.setMaximumHeight(50)
        user_id.setStyleSheet('''QLabel {color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold;}''')
        profile_info_layout.addWidget(user_id)

        settings = QPushButton()
        settings.setFixedSize(40, 40)
        settings.setStyleSheet('''QPushButton {border-radius: 20px} QPushButton:hover {background-color: #575757;}''')
        settings.setCursor(QCursor(Qt.PointingHandCursor))
        settings.setIcon(QIcon('static/image/settings.png'))  # Установите путь к вашему изображению
        settings.setIconSize(QSize(30, 30))
 
        main_layout.addWidget(avatar)
        main_layout.addWidget(profile_info)
        main_layout.addStretch()
        main_layout.addWidget(settings)
        widget.setLayout(main_layout)

        layout.addWidget(widget)
        self.setLayout(layout)



class FullProfile():
    ...
