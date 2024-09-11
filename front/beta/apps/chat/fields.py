from PySide6.QtGui import QIcon, QCursor, QPixmap, QPainter, QColor, QBitmap
from PySide6.QtCore import Qt, QSize, QRect
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QPushButton)

class PlainTextEdit(QTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)

    def insertFromMimeData(self, source):
        # Вставляем только обычный текст, игнорируя форматирование
        plain_text = source.text()
        self.insertPlainText(plain_text)

class UserWidget(QWidget):
    '''Базовая информация о пользователе. '''

    def __init__(self, parent=None):
        super().__init__(parent)

        self.setContentsMargins(0,0,0,0)
        self.setStyleSheet('background-color: rgba(0, 0, 0, 0); border: none;')

        self.avatar = QPushButton()
        self.avatar.setContentsMargins(0,0,0,0)
        self.avatar.setFixedSize(50, 50)
        self.avatar.setStyleSheet('''QPushButton {background-color: rgba(0, 0, 0, 0); border-radius: 20px;}''')
        self.avatar.setCursor(QCursor(Qt.PointingHandCursor))
        self.avatar.setIcon(QIcon('static/image/ava.png'))
        self.avatar.setIconSize(QSize(40, 40))

        profile_info_layout = QVBoxLayout()
        profile_info_layout.setSpacing(0)
        profile_info_layout.setContentsMargins(0,0,0,0)

        self.username = QLabel('Nicname')
        # self.username.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        # self.username.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.username.setFixedHeight(15)
        self.username.setStyleSheet('''QLabel {background-color: rgba(0, 0, 0, 0); color: rgba(255, 255, 255, 1); font-weight: bold; font-size: 13px;}''')
        profile_info_layout.addWidget(self.username)

        self.user_id = QLabel('@kyrlk')
        # self.user_id.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        # self.user_id.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.user_id.setFixedHeight(15)
        self.user_id.setStyleSheet('''QLabel {background-color: rgba(0, 0, 0, 0); color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold;}''')
        profile_info_layout.addWidget(self.user_id)

        self.data_layout = QHBoxLayout()
        self.data_layout.setSpacing(10)
        self.data_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.data_layout.setContentsMargins(0,0,0,0)

        self.data_layout.addWidget(self.avatar)
        self.data_layout.addLayout(profile_info_layout)

        self.setLayout(self.data_layout)

class DarkenButton(QPushButton):
    def __init__(self):
        super().__init__()
        self.original_pixmap = QPixmap('static/image/ava3.jpg')
        self.overlay_pixmap = QPixmap('static/image/camera.png')  # Второе изображение для наложения
        
        self.setStyleSheet('background-color: rgba(255,255,255, 0);')
        self.border_icon = self.get_rounded_pixmap(self.original_pixmap)
        self.setIconSize(QSize(90, 90))
        self.setIcon(QIcon(self.border_icon))
    
    def enterEvent(self, event):
        darkened_pixmap = self.border_icon.copy()
        painter = QPainter(darkened_pixmap)
        # Добавляем затемнение
        painter.fillRect(darkened_pixmap.rect(), QColor(0, 0, 0, 100))
        
        # Накладываем второе изображение поверх
        # Задаём размер наложенного изображения
        overlay_size = QSize(400, 400)  # Определяем размер второго изображения
        scaled_overlay = self.overlay_pixmap.scaled(overlay_size, Qt.KeepAspectRatio, Qt.SmoothTransformation)  # Изменяем размер наложенного изображения
        painter.drawPixmap(
            (darkened_pixmap.width() - overlay_size.width()) // 2,  # По центру
            (darkened_pixmap.height() - overlay_size.height()) // 2,
            scaled_overlay
        )

        rounded_pixmap = self.get_rounded_pixmap(darkened_pixmap)
        
        painter.end()
        self.setIcon(QIcon(rounded_pixmap))  # Устанавливаем иконку с наложением
        super().enterEvent(event)
    
    def leaveEvent(self, event):
        self.setIcon(QIcon(self.border_icon))  # Возвращаем оригинальную иконку
        super().leaveEvent(event)
    
    def get_rounded_pixmap(self, pixmap):
        size = pixmap.size()
        rounded_pixmap = QPixmap(size)
        rounded_pixmap.fill(Qt.transparent)  # Прозрачный фон

        painter = QPainter(rounded_pixmap)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setBrush(QPixmap(pixmap))  # Исходное изображение
        painter.setPen(Qt.NoPen)
        
        # Рисуем закругленные углы
        painter.drawRoundedRect(QRect(0, 0, size.width(), size.height()), 110, 110)
        painter.end()

        return rounded_pixmap
