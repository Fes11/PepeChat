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
        
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.widget = QWidget()
        self.widget.setMaximumSize(920, 532)
        self.widget.setContentsMargins(0,0,0,0)
        self.widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px;}}
                                      QLabel, QTextEdit {{color: rgba(255,255,255, 1); }}
                                      QLabel {{background-color: rgba(0,0,0,0); font-size: 13px; font-weight: bold;}}
                                      QTextEdit {{padding-top: 10px; padding-left: 8px; font-weight: bold; font-size: 13px; border: 1px solid rgba(255,255,255, 0.1)}}''')

        central_layout = QHBoxLayout()
        central_layout.setSpacing(0)
        central_layout.setContentsMargins(0,0,0,0)
        
        self.image = QPushButton()
        self.image.setIcon(QIcon('static/image/login.png'))  # Установите путь к вашему изображению
        self.image.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0); border-radius: 20px;}''')
        self.image.setIconSize(QSize(450, 520))
        self.image.setGraphicsEffect(glow)

        self.form_layout = QVBoxLayout()
        self.form_layout.setSpacing(15)
        self.form_layout.setContentsMargins(50,50,50,50)
        self.form_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.input_login = QTextEdit() 
        self.input_login.setFixedHeight(48)
        self.input_login.setPlaceholderText("Введите логин или мыло: ")
        self.form_layout.addWidget(self.input_login)

        self.input_password = QTextEdit()
        self.input_password.setFixedHeight(48)
        self.input_password.setPlaceholderText("Введите пароль: ")
        self.form_layout.addWidget(self.input_password)
        
        self.new_password = QLabel('Forgot your password?')
        self.new_password.setFixedHeight(15)
        self.form_layout.addWidget(self.new_password)
        
        self.continue_btn = QPushButton('Continue')
        self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.25);
                                           border-radius: 10px; font-size: 16px; font-weight: bold;}''')
        self.continue_btn.setFixedHeight(48)
        self.form_layout.addWidget(self.continue_btn)

        self.reg_lable = QLabel('Нужна учетка? Нажми сюда')
        self.reg_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.reg_lable.setFixedHeight(15)
        self.form_layout.addWidget(self.reg_lable)
        
        self.sign_in_btn = QPushButton('Sign up')
        self.sign_in_btn.setStyleSheet('''QPushButton {color: #FFFFFF; background-color: #7B61FF;
                                           border-radius: 10px; font-size: 16px; font-weight: bold;}''')
        self.sign_in_btn.setFixedHeight(48)
        self.form_layout.addWidget(self.sign_in_btn)

        central_layout.addWidget(self.image)
        central_layout.addLayout(self.form_layout)
        self.widget.setLayout(central_layout)
        
        layout.addWidget(self.widget)
        self.main_layout.addLayout(layout)

