from pathlib import Path
from PySide6.QtGui import QIcon, QCursor, QTransform, QPixmap
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property
from PySide6.QtWidgets import (QVBoxLayout, QListWidget, QHBoxLayout, QWidget, QPushButton, QFileDialog)

from apps.chat.fields import UserWidget
from apps.chat.style import MAIN_BOX_COLOR
from image import get_rounded_image


class Avatar(QPushButton):
    def __init__(self, path: str):
        super(Avatar, self).__init__()
        self.path = path

        self.setFixedSize(30, 30)
        self.setStyleSheet('''border-radius: 15px;''')
        self.setCursor(QCursor(Qt.PointingHandCursor))
        self.original_pixmap = QPixmap(path)
        self.setIcon(QIcon(get_rounded_image(self, self.original_pixmap)))
        self.setIconSize(QSize(30, 30))


class Profile(QWidget):
    def __init__(self):
        super(Profile, self).__init__()
        self.setContentsMargins(0,0,0,0)
        
        
        self._height = 60
        self._avatar_size = QSize(40, 40)
        self.setFixedHeight(self._height)

        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        self.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); border: none; border-radius: 10px;}''')
        self.setMinimumWidth(65)
        self.setMaximumWidth(300)
        
        self.ava_file_list = QListWidget(self)
        self.ava_file_list.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); border: none;}''')
        
        self.widget = QWidget()
        self.widget.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}}}; border: none;''')

        self.main_layout = QVBoxLayout()
        self.main_layout.setContentsMargins(13,10,10,10)

        self.user_widget = UserWidget(self)

        self.arrow_btn = QPushButton()
        self.arrow_btn.setFixedSize(40, 40)
        self.arrow_btn.setStyleSheet('''QPushButton {background-color: rgba(255,255,255,0.1); border-radius: 10px;} 
                                        QPushButton:hover {background-color: rgba(255,255,255,0.2);}''')
        self.arrow_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.arrow_btn.setIcon(QIcon('static/image/arrow.png'))
        self.arrow_btn.setIconSize(QSize(15, 15))
        self.arrow_btn.clicked.connect(self.open_mini_profile)
        self.user_widget.data_layout.addWidget(self.arrow_btn)

        self.settings = QPushButton()
        self.settings.setFixedSize(40, 40)
        self.settings.setStyleSheet('''QPushButton {background-color: rgba(255,255,255,0.1); border-radius: 10px;} 
                                       QPushButton:hover {background-color: rgba(255,255,255,0.2);}''')
        self.settings.setCursor(QCursor(Qt.PointingHandCursor))
        self.settings.setIcon(QIcon('static/image/settings.png'))  # Установите путь к вашему изображению
        self.settings.setIconSize(QSize(30, 30))

        self.user_widget.data_layout.addWidget(self.settings)

        send_layout = QHBoxLayout()
        send_layout.addStretch()
        send_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        self.logout_btn = QPushButton()
        self.logout_btn.setFixedSize(40, 40)
        self.logout_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.logout_btn.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border: none; border-radius: 20px}''')
        self.logout_btn.setIcon(QIcon('static/image/logout.png'))  # Установите путь к вашему изображению
        self.logout_btn.setIconSize(QSize(25, 25))
        self.logout_btn.setVisible(False)
        self.logout_btn.clicked.connect(self.logout)
        # send_layout.addWidget(self.logout_btn)
        
        self.send_change_profile = QPushButton('Редактировать')
        self.send_change_profile.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_change_profile.setFixedSize(90, 40)
        self.send_change_profile.setStyleSheet('''QPushButton {border-radius: 10px; background-color: rgba(255,255,255, 0.1); color:white;} 
                                                  QPushButton:hover {background-color: #575757;}''')
        self.send_change_profile.setVisible(False)
        # send_layout.addWidget(self.send_change_profile)

        self.main_layout.addWidget(self.user_widget)
        self.main_layout.addStretch()
        self.main_layout.addLayout(send_layout)

        self.widget.setLayout(self.main_layout)
        self.widget.setLayout(send_layout)

        layout.addWidget(self.widget)
        self.setLayout(layout)

    def logout(self):
        from apps.authorization.login import LoginScreen
        self.window().swetch_screen(LoginScreen())
        
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
        self.user_widget.avatar.setFixedSize(value)
        self.user_widget.avatar.setIconSize(value)

    def open_mini_profile(self):
        self.rotate_icon(self.arrow_btn, 180)
        if self.height() == 60:
            self.user_widget.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 10px}''')
            # if self.size().width() > 200:
                # self.send_change_profile.setVisible(True)
            # self.logout_btn.setVisible(True)
            self.animate(200, QSize(80, 80))
        else:
            self.user_widget.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 20px}''')
            # self.send_change_profile.setVisible(False)
            # self.logout_btn.setVisible(False)
            self.animate(60, QSize(40, 40))
            
    def rotate_icon(self, widget, angle):
        # Извлекаем изображение из иконки
        pixmap = widget.icon().pixmap(widget.iconSize())
        # Создаем трансформацию для вращения
        transform = QTransform().rotate(angle)
        # Применяем трансформацию к изображению
        rotated_pixmap = pixmap.transformed(transform)
        # Обновляем иконку на кнопке
        rotated_icon = QIcon(rotated_pixmap)
        widget.setIcon(rotated_icon)

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


class MiniProfile():
    ...
