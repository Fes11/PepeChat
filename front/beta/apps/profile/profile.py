from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog, QGridLayout)

from apps.chat.fields import WrapLabel
from apps.chat.style import send_btn_style, MAIN_BOX_COLOR


class MiniProfile(QWidget):
    def __init__(self):
        super(MiniProfile, self).__init__()
        self.setContentsMargins(0,0,0,0)
        
        
        self._height = 60
        self._avatar_size = QSize(40, 40)
        self.setFixedHeight(self._height)

        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        self.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); border: none; border-radius: 10px;}''')
        self.setMinimumWidth(60)
        self.setMaximumWidth(300)
        
        self.ava_file_list = QListWidget(self)
        self.ava_file_list.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); border: none;}''')
        
        self.widget = QWidget()
        self.widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}}}; border: none;''')

        self.main_layout = QVBoxLayout()
        self.main_layout.setContentsMargins(13,10,15,10)

        self.avatar = QPushButton()
        self.avatar.setContentsMargins(0,0,0,0)
        self.avatar.setFixedSize(50, 50)
        self.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 20px;}''')
        self.avatar.setCursor(QCursor(Qt.PointingHandCursor))
        self.avatar.setIcon(QIcon('static/image/ava.png'))
        self.avatar.setIconSize(QSize(40, 40))
        self.avatar.clicked.connect(self.open_file_dialog)

        profile_info_layout = QVBoxLayout()
        profile_info_layout.setSpacing(5)
        profile_info_layout.setContentsMargins(0,0,0,0)

        self.username = QTextEdit('Nicname')
        self.username.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.username.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.username.setFixedHeight(30)
        self.username.setStyleSheet('''QTextEdit {background-color: rgba(0, 0, 0, 0); color: rgba(255, 255, 255, 1); font-weight: bold; font-size: 13px;}''')
        profile_info_layout.addWidget(self.username)

        self.user_id = QTextEdit('@kyrlk')
        self.user_id.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.user_id.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.user_id.setFixedHeight(30)
        self.user_id.setStyleSheet('''QTextEdit {background-color: rgba(0, 0, 0, 0); color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold;}''')
        profile_info_layout.addWidget(self.user_id)

        self.settings = QPushButton()
        self.settings.setFixedSize(40, 40)
        self.settings.setStyleSheet('''QPushButton {background-color: rgba(255,255,255,0.1); border-radius: 10px;} QPushButton:hover {background-color: rgba(255,255,255,0.2);}''')
        self.settings.setCursor(QCursor(Qt.PointingHandCursor))
        self.settings.setIcon(QIcon('static/image/settings.png'))  # Установите путь к вашему изображению
        self.settings.setIconSize(QSize(30, 30))
        self.settings.clicked.connect(self.open_settings)

        self.data_layout = QHBoxLayout()
        self.data_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.data_layout.setContentsMargins(0,0,0,0)

        self.data_layout.addWidget(self.avatar)
        self.data_layout.addLayout(profile_info_layout)
        self.data_layout.addWidget(self.settings)

        send_layout = QHBoxLayout()

        self.logout_btn = QPushButton()
        self.logout_btn.setFixedSize(40, 40)
        self.logout_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.logout_btn.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border: none; border-radius: 20px}''')
        self.logout_btn.setIcon(QIcon('static/image/logout.png'))  # Установите путь к вашему изображению
        self.logout_btn.setIconSize(QSize(25, 25))
        self.logout_btn.setVisible(False)
        self.logout_btn.clicked.connect(self.logout)
        send_layout.addWidget(self.logout_btn)
        
        self.send_change_profile = QPushButton('Редактировать')
        self.send_change_profile.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_change_profile.setFixedSize(90, 40)
        self.send_change_profile.setStyleSheet('''QPushButton {border-radius: 10px; background-color: rgba(255,255,255, 0.1); color:white;} 
                                                  QPushButton:hover {background-color: #575757;}''')
        self.send_change_profile.setVisible(False)
        send_layout.addStretch()
        send_layout.addWidget(self.send_change_profile)

        self.main_layout.addLayout(self.data_layout)
        self.main_layout.addStretch()
        self.main_layout.addLayout(send_layout)

        self.widget.setLayout(self.main_layout)
        self.widget.setLayout(send_layout)

        layout.addWidget(self.widget)
        self.setLayout(layout)

    def logout(self):
        from apps.authorization.login import LoginWindow
        window = LoginWindow()
        window.show()
        self.window().close()
        
    @Property(int)
    def animatedHeight(self):
        return self._height

    @animatedHeight.setter
    def animatedHeight(self, value):
        self._height = value
        self.setFixedHeight(value)

    @Property(QSize)
    def avatarSize(self):
        return self._avatar_size

    @avatarSize.setter
    def avatarSize(self, value):
        self._avatar_size = value
        self.avatar.setFixedSize(value)
        self.avatar.setIconSize(value)

    def open_settings(self):
        if self.height() == 60:
            self.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 10px}''')
            if self.size().width() > 200:
                self.send_change_profile.setVisible(True)
            self.logout_btn.setVisible(True)
            self.animate(200, QSize(80, 80))
        else:
            self.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 20px}''')
            self.send_change_profile.setVisible(False)
            self.logout_btn.setVisible(False)
            self.animate(60, QSize(40, 40))

    def animate(self, end_height, end_avatar_size): 
        # Анимация высоты
        self.height_animation = QPropertyAnimation(self, b"animatedHeight")
        self.height_animation.setDuration(500)
        self.height_animation.setStartValue(self.height())
        self.height_animation.setEndValue(end_height)
        self.height_animation.setEasingCurve(QEasingCurve.Type.InOutQuart)

        # Анимация размера аватара
        self.avatar_animation = QPropertyAnimation(self, b"avatarSize")
        self.avatar_animation.setDuration(500)
        self.avatar_animation.setStartValue(self.avatarSize)
        self.avatar_animation.setEndValue(end_avatar_size)
        self.avatar_animation.setEasingCurve(QEasingCurve.Type.InOutQuart)

        # Запуск обеих анимаций
        self.height_animation.start()
        self.avatar_animation.start()
        
    def open_file_dialog(self):
        dialog = QFileDialog(self)
        dialog.setFileMode(QFileDialog.FileMode.ExistingFiles)
        dialog.setNameFilter("Images (*.png *.jpg)")
        dialog.setViewMode(QFileDialog.ViewMode.List)
        if dialog.exec():
            filenames = dialog.selectedFiles()
            if filenames:
                self.ava_file_list.addItems([str(Path(filename)) for filename in filenames])

class FullProfile():
    ...

