from pathlib import Path
from PySide6.QtGui import QIcon, QCursor, QTransform, QPixmap, QRegion, QPainterPath
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property, QRectF
from PySide6.QtWidgets import (QVBoxLayout, QListWidget, QHBoxLayout, QWidget, QPushButton, QFileDialog, QLabel)

from apps.chat.fields import UserWidget
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR
from image import get_rounded_image, scaled_image, darken_image


class Avatar(QPushButton):
    def __init__(self, path: str):
        super(Avatar, self).__init__()
        self.path = path

        self.setFixedSize(30, 30)
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

        self.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); border: none;}''')
        self.setMinimumWidth(65)
        self.setMaximumWidth(300)
        
        self.ava_file_list = QListWidget(self)
        self.ava_file_list.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); border: none;}''')
        
        self.widget = QWidget()
        self.widget.setStyleSheet(f'''background-color: {MAIN_BOX_COLOR}; border: none; border-radius: 10px;''')

        self.main_layout = QVBoxLayout()
        self.main_layout.setContentsMargins(0,0,0,0)

        self.btn_layout = QHBoxLayout()
        self.btn_layout.setContentsMargins(10,10,10,10)

        self.user_widget = UserWidget(self)
        self.btn_layout.addWidget(self.user_widget)

        self.logout_btn = QPushButton(' Logout')
        self.logout_btn.setFixedSize(80, 40)
        self.logout_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.logout_btn.setStyleSheet('''QPushButton {background-color: rgb(255, 92, 92); color: white; font-size: 12px; 
                                         font-weight: bold; border: none; border-radius: 10px}
                                         QPushButton:hover {background-color: rgb(255, 112, 112);}''')
        self.logout_btn.setIcon(QIcon('static/image/logout.png'))  # Установите путь к вашему изображению
        self.logout_btn.setIconSize(QSize(20, 20))
        self.logout_btn.setVisible(False)
        self.logout_btn.clicked.connect(self.logout)
        self.btn_layout.addWidget(self.logout_btn)
        self.btn_layout.addStretch()

        self.arrow_btn = QPushButton()
        self.arrow_btn.setFixedSize(40, 40)
        self.arrow_btn.setStyleSheet('''QPushButton {background-color: rgba(255,255,255,0.1); border-radius: 10px;} 
                                        QPushButton:hover {background-color: rgba(255,255,255,0.2);}''')
        self.arrow_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.arrow_btn.setIcon(QIcon('static/image/arrow.png'))
        self.arrow_btn.setIconSize(QSize(15, 15))
        self.arrow_btn.clicked.connect(self.open_mini_profile)
        self.btn_layout.addWidget(self.arrow_btn)

        self.settings = QPushButton()
        self.settings.setFixedSize(40, 40)
        self.settings.setStyleSheet('''QPushButton {background-color: rgba(255,255,255,0.1); border-radius: 10px;} 
                                       QPushButton:hover {background-color: rgba(255,255,255,0.2);}''')
        self.settings.setCursor(QCursor(Qt.PointingHandCursor))
        self.settings.setIcon(QIcon('static/image/settings.png'))  # Установите путь к вашему изображению
        self.settings.setIconSize(QSize(30, 30))

        self.btn_layout.addWidget(self.settings)
        
        self.send_change_profile = QPushButton('Редактировать')
        self.send_change_profile.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_change_profile.setFixedSize(90, 40)
        self.send_change_profile.setStyleSheet('''QPushButton {border-radius: 10px; background-color: rgba(255,255,255, 0.1); color:white;} 
                                                  QPushButton:hover {background-color: #575757;}''')
        self.send_change_profile.setVisible(False)
        
        self.mini_profile = MiniProfile()
        self.mini_profile.setVisible(False)
        self.main_layout.addWidget(self.mini_profile)

        self.main_layout.addLayout(self.btn_layout)
        self.widget.setLayout(self.main_layout)

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
            self.user_widget.setVisible(False)
            self.mini_profile.setVisible(True)
            self.logout_btn.setVisible(True)
            self.animate(340, QSize(80, 80))
        else:
            self.user_widget.setVisible(True)
            self.mini_profile.setVisible(False)
            self.logout_btn.setVisible(False)
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
        # self.avatar_animation = QPropertyAnimation(self, b"avatarSize")
        # self.avatar_animation.setDuration(500)
        # self.avatar_animation.setStartValue(self.avatarSize)
        # self.avatar_animation.setEndValue(end_avatar_size)
        # self.avatar_animation.setEasingCurve(QEasingCurve.Type.InOutQuart)

        # Запуск обеих анимаций
        self.height_animation.start()
        # self.avatar_animation.start()
        
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


class MiniProfile(QWidget):
    def __init__(self):
        super(MiniProfile, self).__init__()

        self.setStyleSheet('color: white; font-weight: bold;') # background-color: rgba(0,0,0,0);

        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        self.background_img = QLabel()
        self.background_img.setFixedSize(300, 160)
        self.background_img.setStyleSheet('''border-top-left-radius: 10px;
                                             border-top-right-radius: 10px; background-color: grey;''')
        original_pixmap = darken_image('static/image/ava2.jpg', 'static/image/dark_img.jpg')
        original_pixmap = scaled_image('static/image/dark_img.jpg')
        self.corner_radius = 8
        path = QPainterPath()
        rect = QRectF(0, 0, self.background_img.width(), self.background_img.height())
        
        # Закругляем только верхние углы
        path.moveTo(self.corner_radius, 0)
        path.lineTo(rect.width() - self.corner_radius, 0)
        path.quadTo(rect.width(), 0, rect.width(), self.corner_radius)
        path.lineTo(rect.width(), rect.height())
        path.lineTo(0, rect.height())
        path.lineTo(0, self.corner_radius)
        path.quadTo(0, 0, self.corner_radius, 0)
        
        # Устанавливаем маску для виджета
        rounded_region = QRegion(path.toFillPolygon().toPolygon())
        self.background_img.setMask(rounded_region)
        self.background_img.setPixmap(QPixmap(original_pixmap))
        self.background_img.setPixmap(QPixmap(original_pixmap))

        self.change_background_img = QPushButton()
        self.change_background_img.setIcon(QPixmap('static/image/pen.png'))
        self.change_background_img.setIconSize(QSize(15, 15))
        self.change_background_img.setCursor(QCursor(Qt.PointingHandCursor))
        self.change_background_img.setFixedSize(30,30)
        self.change_background_img.setStyleSheet('''QPushButton {background-color: rgba(0,0,0,0.8); color: white; font-size: 16px;}
                                                    QPushButton:hover {background-color: rgba(0,0,0,0.6);}''')

        self.change_background_img_layout = QVBoxLayout()
        self.change_background_img_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.change_background_img_layout.addWidget(self.change_background_img)
        
        self.background_img.setLayout(self.change_background_img_layout)

        self.user_layout = QHBoxLayout()
        self.user_layout.setSpacing(15)
        self.user_layout.setContentsMargins(10,0,0,0)
        self.user_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)

        self.avatar = QPushButton()
        self.avatar.setStyleSheet('border-radius: 35px; background-color: white;')
        self.avatar.setFixedSize(73,73)
        self.avatar.setIcon(QIcon('static/image/ava.png'))
        self.avatar.setIconSize(QSize(70,70))
        self.user_layout.addWidget(self.avatar)

        self.chang_btn = QPushButton(' Редактировать')
        self.chang_btn.setIcon(QIcon('static/image/pen.png'))
        self.chang_btn.setIconSize(QSize(15,15))
        self.chang_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.chang_btn.setFixedSize(130, 25)
        self.chang_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; color: white; border-radius: 10px; font-size: 12px;}}
                                        QPushButton:hover {{background-color: rgb(134, 110, 255)}}''')
        self.user_layout.addWidget(self.chang_btn)

        self.form_layout = QVBoxLayout()
        self.form_layout.setSpacing(0)
        self.form_layout.setContentsMargins(10,0,0,0)

        self.nickname = QLabel('Username')
        self.nickname.setStyleSheet('background-color: rgba(0,0,0,0); font-size: 13px;')
        self.nickname.setFixedHeight(20)
        self.form_layout.addWidget(self.nickname)

        self.login = QLabel('@Login')
        self.login.setStyleSheet('background-color: rgba(0,0,0,0)')
        self.login.setFixedHeight(20)
        self.form_layout.addWidget(self.login)

        self.descripton = QLabel('Описание....')
        self.descripton.setStyleSheet('background-color: rgba(255,255,255,0.1); padding: 10px;')
        self.descripton.setFixedSize(200, 30)

        self.descripton_layout = QVBoxLayout()
        self.descripton_layout.setContentsMargins(10,0,0,0)
        self.descripton_layout.addWidget(self.descripton)

        layout.addWidget(self.background_img)
        layout.addLayout(self.user_layout)
        layout.addLayout(self.form_layout)
        layout.addLayout(self.descripton_layout)

        self.setLayout(layout)
