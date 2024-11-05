from PySide6.QtGui import QPixmap, QCursor, QIcon, QColor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import ( QTextEdit, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QPushButton, QLineEdit, QFormLayout)
from apps.chat.window import ChatScreen
from apps.chat.style import MAIN_BOX_COLOR

class RegScreen(QWidget):
    '''Окно регистрации.'''
    def __init__(self, parent=None):
        super(RegScreen, self).__init__(parent)
        
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
        
        self.form = RegForm(self)
        
        central_layout.addWidget(image)
        central_layout.addWidget(self.form)
        self.widget.setLayout(central_layout)
        
        layout.addWidget(self.widget)
        self.setLayout(layout)
    
    def open_sign_in(self):
        from apps.authorization.login import LoginScreen

        parent_window = self.window()  # Получаем главное окно
        parent_window.swetch_screen(LoginScreen())


class RegForm(QWidget):
    '''Форма регистрации.'''
    def __init__(self, reg_screen):
        super(RegForm, self).__init__()
        self.reg_screen = reg_screen

        self.form_layout = QFormLayout()
        self.form_layout.setVerticalSpacing(15)
        self.form_layout.setHorizontalSpacing(0) 
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
        welcome_lable.setFixedHeight(45)
        welcome_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        welcome_lable.setStyleSheet('QLabel {font-size: 40px;}')
        welcome_layout.addWidget(welcome_lable)
        self.form_layout.addRow(welcome_layout)

        welcome_description = QLabel('Sign up')
        welcome_description.setFixedHeight(20)
        welcome_description.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.form_layout.addWidget(welcome_description)

        self.input_email = self.create_input_row("Введите электронную почту: ")
        self.input_password = self.create_input_row("Введите пароль: ", QLineEdit.Password)
        self.input_repeat_password = self.create_input_row("Подтвердите пароль: ", QLineEdit.Password)

        self.error_login = QLabel()
        self.error_login.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.error_login.setStyleSheet('color: #7B61FF;')
        self.error_login.setVisible(False)
        self.form_layout.addWidget(self.error_login)
        
        self.continue_btn = QPushButton('Continue')
        self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.10);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')
        self.continue_btn.setFixedHeight(48)
        self.continue_btn.setEnabled(False)
        self.continue_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.form_layout.addWidget(self.continue_btn)

        reg_layout = QVBoxLayout()
        reg_layout.setSpacing(15)
        reg_layout.setContentsMargins(0, 10, 0, 0)

        self.reg_lable = QLabel('Есть акк? Нажми сюда')
        self.reg_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.reg_lable.setFixedHeight(15)
        reg_layout.addWidget(self.reg_lable)
        
        self.sign_in_btn = QPushButton('Sign in')
        self.sign_in_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.sign_in_btn.setStyleSheet('''QPushButton {color: #FFFFFF; background-color: #7B61FF;
                                                       border-radius: 10px; font-size: 16px; font-weight: bold;}
                                          QPushButton:hover {background-color: #9783FF}''')

        self.sign_in_btn.setFixedHeight(48)
        self.sign_in_btn.clicked.connect(self.reg_screen.open_sign_in)
        reg_layout.addWidget(self.sign_in_btn)

        autro_lable = QLabel('By registering, you accept the \nUser Agreement')
        autro_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        autro_lable.setStyleSheet('QLabel {color: rgba(255,255,255, 0.45)}')
        reg_layout.addWidget(autro_lable)

        self.form_layout.addRow('', reg_layout)

        self.setLayout(self.form_layout)
    
    def create_input_row(self, placeholder, echo_mode=QLineEdit.Normal):
        dots_label = QLabel("*")
        dots_label.setStyleSheet('color: white; font-size: 30px; padding-top: 7px;')
        
        input_field = QLineEdit()
        input_field.textChanged.connect(self.active_continue_btn)
        input_field.setFixedHeight(48)
        input_field.setPlaceholderText(placeholder)
        input_field.setEchoMode(echo_mode)
        
        self.form_layout.addRow(dots_label, input_field)
        return input_field
    
    def active_continue_btn(self):
        if self.input_email.text() and self.input_password.text() and self.input_repeat_password.text():
            self.continue_btn.setEnabled(True)
            self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.25);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}
                                                QPushButton:hover {background-color: rgba(255,255,255,0.4)}''')
        else:
            self.continue_btn.setEnabled(False)
            self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.1);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')

    def create_account(self):
        pass 



class ProfileDesignForm(QWidget):
    '''Оформление профиля.'''
    def __init__(self, parent=None):
        super(ProfileDesignForm, self).__init__(parent)

    def update_account(self):
        pass
