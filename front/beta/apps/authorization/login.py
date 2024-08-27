import sys
from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QPixmap, QCursor, QIcon
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog, QGridLayout)

from apps.chat.style import MAIN_BOX_COLOR, glow
from window import Window


class LoginWindow(Window):
    def __init__(self) -> None:
        super(LoginWindow, self).__init__()

        left_layout = QVBoxLayout()
        left_layout.setContentsMargins(0,0,30,0)
        left_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # logo = QLabel(self)
        # pixmap = QPixmap('static/image/logo.png')
        # pixmap.scaled(300, 300)
        # logo.setPixmap(pixmap)
        # logo.setGraphicsEffect(glow)

        self.logo = QPushButton()
        self.logo.setIcon(QIcon('static/image/big_logo.png'))  # Установите путь к вашему изображению
        self.logo.setIconSize(QSize(250, 250))
        self.logo.setGraphicsEffect(glow)

        left_layout.addWidget(self.logo)

        self.widget = QWidget()
        self.widget.setMaximumWidth(400)
        self.widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px;}}
                                      QLabel, QTextEdit {{color: rgba(255,255,255, 1); }}
                                      QLabel {{background-color: rgba(0,0,0,0); font-size: 13px; font-weight: bold;}}''')

        self.form_layout = QVBoxLayout()
        self.form_layout.setSpacing(0)
        self.form_layout.setContentsMargins(0,0,0,0)
        self.form_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.login_lable = QLabel('Введите логин или мыло:')
        self.login_lable.setFixedSize(320, 40)
        self.form_layout.addWidget(self.login_lable)
        
        self.input_login = QTextEdit()
        self.input_login.setFixedSize(320, 40)
        self.form_layout.addWidget(self.input_login)

        self.password_label = QLabel('Введите пароль:')
        self.password_label.setFixedSize(320, 40)
        self.form_layout.addWidget(self.password_label)

        self.input_password = QTextEdit()
        self.input_password.setFixedSize(320, 40)
        self.form_layout.addWidget(self.input_password)

        self.reg_lable = QPushButton('Нужна учетка? Нажми сюда')
        self.reg_lable.setObjectName('reg_lable')
        self.reg_lable.setCursor(QCursor(Qt.PointingHandCursor))
        self.reg_lable.setStyleSheet('''QPushButton {background-color: rgba(0,0,0,0); color: rgba(123, 97, 255, 0.8); font-size: 12px;}
                                        QPushButton:hover {color: rgba(123, 97, 255, 1);}''')
        self.reg_lable.setFixedSize(320, 40)
        self.form_layout.addWidget(self.reg_lable)

        self.widget.setLayout(self.form_layout)

        self.main_layout.setContentsMargins(30,30,30,30)
        self.main_layout.addLayout(left_layout)
        self.main_layout.addWidget(self.widget)

