import re
from PySide6.QtGui import QPixmap, QCursor, QIcon, QColor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import ( QTextEdit, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QPushButton, QLineEdit, QFormLayout)
from apps.chat.window import ChatScreen
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR

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
        self.form.continue_btn.clicked.connect(self.swich_form)
        self.form.setStyleSheet('background-color: rgba(0,0,0,0);')

        self.chage_form = ProfileDesignForm(self)
        self.chage_form.setVisible(False)

        self.form_layout = QFormLayout()
        self.form_layout.setContentsMargins(30,20,50,20)
        self.form_layout.setVerticalSpacing(10)

        welcome_layout = QHBoxLayout()
        welcome_layout.setSpacing(10)
        welcome_layout.setContentsMargins(0,0,0,0)

        logo = QLabel(self)
        logo.setStyleSheet(f'''background-color: {MAIN_COLOR}; border-radius: 12px;''')
        logo.setFixedSize(50,50)
        pixmap = QPixmap('static/image/logo.png')
        pixmap.scaled(30, 30)
        logo.setPixmap(pixmap)

        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)  # радиус размытия
        rgba = list(map(int, re.findall(r'\d+', MAIN_COLOR)))
        color = QColor(rgba[0], rgba[1], rgba[2])
        self.glow.setColor(color)  # цвет свечения
        self.glow.setOffset(0, 0)  # смещение тени
        logo.setGraphicsEffect(self.glow)
        welcome_layout.addWidget(logo)

        welcome_lable = QLabel('Welcome!')
        welcome_lable.setFixedHeight(45)
        welcome_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        welcome_lable.setStyleSheet('QLabel {font-size: 40px;}')
        welcome_layout.addWidget(welcome_lable)
        self.form_layout.addRow('', welcome_layout)

        welcome_description = QLabel('Refistration')
        welcome_description.setFixedHeight(20)
        welcome_description.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.form_layout.addWidget(welcome_description)

        central_layout.addWidget(image)
        self.form_layout.addWidget(self.form)
        self.form_layout.addWidget(self.chage_form)
        self.widget.setLayout(central_layout)

        self.autro_layout = QVBoxLayout()
        self.autro_layout.setSpacing(10)
        self.autro_layout.setContentsMargins(35,20,0,0)

        self.autro_lable = QLabel('Есть акк? Нажми сюда')
        self.autro_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.autro_lable.setFixedHeight(15)
        self.autro_layout.addWidget(self.autro_lable)
        
        self.sign_in_btn = QPushButton('Sign in')
        self.sign_in_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.sign_in_btn.setStyleSheet(f'''QPushButton {{color: #FFFFFF; background-color: {MAIN_COLOR};
                                                       border-radius: 10px; font-size: 16px; font-weight: bold;}}
                                          QPushButton:hover {{background-color: {HOVER_MAIN_COLOR}}}''')

        self.sign_in_btn.setFixedHeight(48)
        self.sign_in_btn.clicked.connect(self.open_sign_in)
        self.autro_layout.addWidget(self.sign_in_btn)

        agreement_lable = QLabel('By registering, you accept the \nUser Agreement')
        agreement_lable.setAlignment(Qt.AlignmentFlag.AlignCenter)
        agreement_lable.setStyleSheet('QLabel {color: rgba(255,255,255, 0.45)}')
        self.autro_layout.addWidget(agreement_lable)

        self.form_layout.addRow(self.autro_layout)
        central_layout.addLayout(self.form_layout)
        
        layout.addWidget(self.widget)
        self.setLayout(layout)
    
    def swich_form(self):
        self.form.setVisible(False)
        self.chage_form.setVisible(True)
        if self.chage_form.isVisible():
            self.sign_in_btn.setVisible(False)
            self.autro_lable.setVisible(False)
        else:
            self.sign_in_btn.setVisible(True)
            self.autro_lable.setVisible(True)
    
    def open_sign_in(self):
        from apps.authorization.login import LoginScreen

        parent_window = self.window()  # Получаем главное окно
        parent_window.swetch_screen(LoginScreen())


class RegForm(QWidget):
    '''Форма регистрации.'''
    def __init__(self, reg_screen):
        super(RegForm, self).__init__()
        self.reg_screen = reg_screen

        self.form_layout = QVBoxLayout()
        self.form_layout.setSpacing(0)
        self.form_layout.setContentsMargins(0,0,0,0)
        self.form_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.create_form = QFormLayout()
        self.create_form.setContentsMargins(0,0,0,0)
        self.create_form.setVerticalSpacing(15)
        self.create_form.setHorizontalSpacing(0) 

        self.create_widget = QWidget()

        self.input_email = self.create_input_row("Введите электронную почту: ")
        self.input_password = self.create_input_row("Введите пароль: ", QLineEdit.Password)
        self.input_repeat_password = self.create_input_row("Подтвердите пароль: ", QLineEdit.Password)
        
        self.continue_btn = QPushButton('Continue')
        self.continue_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.10);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')
        self.continue_btn.setFixedHeight(48)
        self.continue_btn.setEnabled(False)
        self.continue_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.create_form.addRow('', self.continue_btn)

        self.create_widget.setLayout(self.create_form)
        self.form_layout.addWidget(self.create_widget)

        self.error_login = QLabel()
        self.error_login.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.error_login.setStyleSheet('color: #7B61FF;')
        self.error_login.setVisible(False)
        self.form_layout.addWidget(self.error_login)

        self.setLayout(self.form_layout)
    
    def create_input_row(self, placeholder, echo_mode=QLineEdit.Normal):
        dots_label = QLabel("*")
        dots_label.setStyleSheet('color: white; font-size: 30px; padding-top: 7px;')
        
        input_field = QLineEdit()
        input_field.textChanged.connect(self.active_continue_btn)
        input_field.setFixedHeight(48)
        input_field.setPlaceholderText(placeholder)
        input_field.setEchoMode(echo_mode)
        
        self.create_form.addRow(dots_label, input_field)
        return input_field
    
    def active_continue_btn(self):
        if self.input_email.text() and self.input_password.text() and self.input_repeat_password.text():
            self.continue_btn.setEnabled(True)
            self.continue_btn.setStyleSheet('''QPushButton {color: white; background-color: rgba(255,255,255,0.25);
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

        layout = QVBoxLayout()
        layout.setSpacing(50)
        layout.setContentsMargins(35,50,0,0)

        top_layout = QHBoxLayout()
        top_layout.setSpacing(15)

        change_img = QPushButton()
        change_img.setContentsMargins(0,0,0,0)
        change_img.setIcon(QIcon('static/image/camera.png'))
        change_img.setCursor(QCursor(Qt.PointingHandCursor))
        change_img.setIconSize(QSize(60,60))
        change_img.setStyleSheet('''QPushButton {background-color: rgba(255,255,255,0.1);}
                                    QPushButton:hover {background-color: rgba(255,255,255,0.3);}''')
        change_img.setFixedSize(120, 120)
        top_layout.addWidget(change_img)

        input_layout = QVBoxLayout()
        input_layout.setSpacing(10)

        self.input_login = QLineEdit()
        self.input_login.setFixedHeight(48)
        self.input_login.setPlaceholderText('Ввидите логин...')
        self.input_login.textChanged.connect(self.active_finish_btn)
        input_layout.addWidget(self.input_login)

        self.input_name = QLineEdit()
        self.input_name.setFixedHeight(48)
        self.input_name.setPlaceholderText('Ввидите никнейм...')
        self.input_name.textChanged.connect(self.active_finish_btn)
        input_layout.addWidget(self.input_name)

        top_layout.addLayout(input_layout)

        self.finish_btn = QPushButton('Finish') 
        self.finish_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.10);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')
        self.finish_btn.setFixedHeight(48)
        self.finish_btn.setEnabled(False)
        self.finish_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.finish_btn.clicked.connect(self.finish_reg)

        layout.addLayout(top_layout)
        layout.addWidget(self.finish_btn)

        self.setLayout(layout)
    
    def active_finish_btn(self):
        if self.input_name.text():
            self.finish_btn.setEnabled(True)
            self.finish_btn.setStyleSheet('''QPushButton {color: white; background-color: rgba(255,255,255,0.25);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}
                                                QPushButton:hover {background-color: rgba(255,255,255,0.4)}''')
        else:
            self.finish_btn.setEnabled(False)
            self.finish_btn.setStyleSheet('''QPushButton {color: rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.1);
                                                        border-radius: 10px; font-size: 16px; font-weight: bold;}''')

    def update_account(self):
        pass

    def finish_reg(self):
        parent_window = self.window()  # Получаем главное окно
        parent_window.swetch_screen(ChatScreen(parent_window))
