from PySide6.QtGui import QPixmap, QCursor, QIcon, QColor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import ( QTextEdit, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QPushButton, QLineEdit)

from .registration import RegScreen
from apps.chat.window import ChatScreen
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR


class LoginScreen(QWidget):
    def __init__(self, parent=None):
        super(LoginScreen, self).__init__(parent)
        
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
        self.image_glow = QGraphicsDropShadowEffect(self)
        self.image_glow.setBlurRadius(80)  # радиус размытия
        self.image_glow.setColor(QColor(123, 97, 255))  # цвет свечения
        self.image_glow.setOffset(0, 0)  # смещение тени
        image.setGraphicsEffect(self.image_glow)

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
        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)  # радиус размытия
        self.glow.setColor(QColor(123, 97, 255))  # цвет свечения
        self.glow.setOffset(0, 0)  # смещение тени
        logo.setGraphicsEffect(self.glow)
        welcome_layout.addWidget(logo)

        welcome_lable = QLabel('Welcome!')
        welcome_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        welcome_lable.setStyleSheet('QLabel {font-size: 40px;}')
        welcome_layout.addWidget(welcome_lable)

        self.form_layout.addLayout(welcome_layout)

        welcome_description = QLabel('Log in to your account \nor register to use the chat')
        welcome_description.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.form_layout.addWidget(welcome_description)
        
        self.input_login = QLineEdit() 
        self.input_login.setFixedHeight(48)
        self.input_login.setPlaceholderText("Введите логин или мыло: ")
        self.input_login.textChanged.connect(self.active_login_btn)
        self.form_layout.addWidget(self.input_login)

        self.input_password = QLineEdit()
        self.input_password.setEchoMode(QLineEdit.Password)
        self.input_password.setFixedHeight(48)
        self.input_password.setPlaceholderText("Введите пароль: ")
        self.input_password.textChanged.connect(self.active_login_btn)
        self.form_layout.addWidget(self.input_password)
        
        self.error_login = QLabel()
        self.error_login.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.error_login.setStyleSheet('color: #7B61FF;')
        self.error_login.setVisible(False)
        self.form_layout.addWidget(self.error_login)
        
        self.new_password = QLabel('Forgot your password?')
        self.new_password.setStyleSheet('''QLabel:hover {color: rgba(255,255,255,0.65);}''')
        self.new_password.setCursor(QCursor(Qt.PointingHandCursor))
        self.new_password.setFixedHeight(17)
        self.form_layout.addWidget(self.new_password)

        
        self.continue_btn = QPushButton('Login')
        self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.10);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')
        self.continue_btn.setFixedHeight(48)
        self.continue_btn.setEnabled(False)
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
        self.sign_in_btn.setStyleSheet(f'''QPushButton {{color: #FFFFFF; background-color: {MAIN_COLOR};
                                                       border-radius: 10px; font-size: 16px; font-weight: bold;}}
                                          QPushButton:hover {{background-color: {HOVER_MAIN_COLOR}}}''')

        self.sign_in_btn.setFixedHeight(48)
        self.sign_in_btn.clicked.connect(self.open_reg)
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
        self.setLayout(layout)
    
    def active_login_btn(self):
        if self.input_login.text() and self.input_password.text():
            self.continue_btn.setEnabled(True)
            self.continue_btn.setStyleSheet('''QPushButton {color: white; background-color: rgba(255,255,255,0.25);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}
                                                QPushButton:hover {background-color: rgba(255,255,255,0.4)}''')
        else:
            self.continue_btn.setEnabled(False)
            self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.1);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')
    def open_reg(self):
        parent_window = self.window()  # Получаем главное окно
        parent_window.swetch_screen(RegScreen())
        
    def login(self):
        login_text = self.input_login.text()
        password_text = self.input_password.text()

        if login_text != '123':
            self.input_login.setStyleSheet('border: 0.5px solid #7B61FF;')
            self.error_login.setVisible(True)
            self.error_login.setText('Неверный логин')
        elif password_text != '123':
            self.input_password.setStyleSheet('border: 0.5px solid #7B61FF;')
            self.error_login.setVisible(True)
            self.error_login.setText('Неверный пароль')
        else:
            parent_window = self.window()  # Получаем главное окно
            self.error_login.setVisible(False)
            parent_window.swetch_screen(ChatScreen())  # Заменяем виджет на окно чата
