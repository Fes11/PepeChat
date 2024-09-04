import sys
from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QPixmap, QCursor, QIcon, QColor
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog, QLineEdit)

from apps.chat.chat_window import MainWindow
from apps.chat.style import MAIN_BOX_COLOR, glow
from window import Window


class LoginWindow(Window):
    def __init__(self) -> None:
        super(LoginWindow, self).__init__()
        
        self.setGeometry(350,170, 1100, 750)
        
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.widget = QWidget()
        self.widget.setMaximumSize(920, 532)
        self.widget.setContentsMargins(0,0,0,0)
        self.widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px;}}
                                      QLabel, QTextEdit, QLineEdit {{color: rgba(255,255,255, 1); background-color: rgba(255, 255, 255, 0.1);}}
                                      QLabel {{background-color: rgba(0,0,0,0); font-size: 13px; font-weight: bold;}}
                                      QTextEdit {{padding-top: 10px; padding-left: 8px; font-weight: bold; font-size: 13px; 
                                                  border: 1px solid rgba(255,255,255, 0.2)}}
                                      QLineEdit {{padding-left: 8px; font-weight: bold; font-size: 13px; border: 1px solid rgba(255,255,255, 0.2)}}''')

        central_layout = QHBoxLayout()
        central_layout.setSpacing(0)
        central_layout.setContentsMargins(0,0,0,0)
        
        image = QPushButton()
        image.setIcon(QIcon('static/image/login.png'))  # Установите путь к вашему изображению
        image.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0); border-radius: 20px;}''')
        image.setIconSize(QSize(450, 520))
        image_glow = QGraphicsDropShadowEffect(self)
        image_glow.setBlurRadius(80)  # радиус размытия
        image_glow.setColor(QColor(123, 97, 255))  # цвет свечения
        image_glow.setOffset(0, 0)  # смещение тени
        image.setGraphicsEffect(image_glow)

        self.form_layout = QVBoxLayout()
        self.form_layout.setSpacing(15)
        self.form_layout.setContentsMargins(50,20,50,20)
        self.form_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        welcome_layout = QHBoxLayout()
        welcome_layout.setSpacing(0)
        welcome_layout.setContentsMargins(0,0,0,0)

        logo = QLabel(self)
        logo.setFixedSize(50,50)
        pixmap = QPixmap('static/image/logo.png')
        pixmap.scaled(30, 30)
        logo.setPixmap(pixmap)
        logo.setGraphicsEffect(glow)
        welcome_layout.addWidget(logo)

        welcome_lable = QLabel('Welcome!')
        welcome_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        welcome_lable.setStyleSheet('QLabel {font-size: 40px;}')
        welcome_layout.addWidget(welcome_lable)

        self.form_layout.addLayout(welcome_layout)

        welcome_description = QLabel('Log in to your account \nor register to use the chat')
        welcome_description.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.form_layout.addWidget(welcome_description)
        
        self.input_login = QTextEdit() 
        self.input_login.setFixedHeight(48)
        self.input_login.setPlaceholderText("Введите логин или мыло: ")
        self.form_layout.addWidget(self.input_login)

        self.input_password = QLineEdit()
        self.input_password.setEchoMode(QLineEdit.Password)
        self.input_password.setFixedHeight(48)
        self.input_password.setPlaceholderText("Введите пароль: ")
        self.form_layout.addWidget(self.input_password)
        
        self.new_password = QLabel('Forgot your password?')
        self.new_password.setStyleSheet('''QLabel:hover {color: rgba(255,255,255,0.65);}''')
        self.new_password.setCursor(QCursor(Qt.PointingHandCursor))
        self.new_password.setFixedHeight(17)
        self.form_layout.addWidget(self.new_password)

        self.error_login = QLabel('Неверный логин')
        self.error_login.setStyleSheet('color: red;')

        self.error_password = QLabel('Неверный пароль')
        self.error_password.setStyleSheet('color: red;')
        
        self.continue_btn = QPushButton('Login')
        self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.25);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}
                                           QPushButton:hover {background-color: rgba(255,255,255,0.4)}''')
        self.continue_btn.setFixedHeight(48)
        self.continue_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.continue_btn.clicked.connect(self.login)
        self.form_layout.addWidget(self.continue_btn)


        reg_layout = QVBoxLayout()
        reg_layout.setContentsMargins(0, 10, 0, 0)

        self.reg_lable = QLabel('Нужна учетка? Нажми сюда')
        self.reg_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.reg_lable.setFixedHeight(15)
        reg_layout.addWidget(self.reg_lable)
        
        self.sign_in_btn = QPushButton('Sign up')
        self.sign_in_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.sign_in_btn.setStyleSheet('''QPushButton {color: #FFFFFF; background-color: #7B61FF;
                                                       border-radius: 10px; font-size: 16px; font-weight: bold;}
                                          QPushButton:hover {background-color: #9783FF}''')
        self.sign_in_btn.setFixedHeight(48)
        reg_layout.addWidget(self.sign_in_btn)

        autro_lable = QLabel('By registering, you accept the \nUser Agreement')
        autro_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        autro_lable.setStyleSheet('QLabel {color: rgba(255,255,255, 0.45)}')
        reg_layout.addWidget(autro_lable)

        self.form_layout.addLayout(reg_layout)

        central_layout.addWidget(image)
        central_layout.addLayout(self.form_layout)
        self.widget.setLayout(central_layout)
        
        layout.addWidget(self.widget)
        self.main_layout.addLayout(layout)

    def login(self):
        login_text = self.input_login.toPlainText()
        password_text = self.input_password.text()

        if login_text != '123':
            self.input_login.setStyleSheet('border: 0.5px solid darkred;')
            self.form_layout.addWidget(self.error_login)
        elif password_text != '123':
            self.input_password.setStyleSheet('border: 0.5px solid darkred;')
            self.form_layout.addWidget(self.error_password)
        else:
            window = MainWindow()
            window.show()
            self.close()
