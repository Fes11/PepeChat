from pathlib import Path
from PySide6.QtGui import QIcon, QCursor, QPixmap, QPainter, QColor, QBitmap
from PySide6.QtCore import Qt, QSize, QRect
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QFileDialog,
                               QHBoxLayout, QWidget, QPushButton, QListWidget)
from PySide6.QtCore import Signal

from image import get_rounds_edges_image

class PlainTextEdit(QTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setContextMenuPolicy(Qt.NoContextMenu)

    def insertFromMimeData(self, source):
        # Вставляем только обычный текст, игнорируя форматирование
        plain_text = source.text()
        self.insertPlainText(plain_text)

class HoverButton(QPushButton):
    def __init__(self, text, path=None):
        super().__init__(text)
        self.path = path
        self.setIcon(QIcon(f'{self.path}.png')) 
        
    def enterEvent(self, event):
        # Меняем цвет кнопки при наведении курсора
        self.setIcon(QIcon(f'{self.path}_hover.png'))
        super().enterEvent(event)

    def leaveEvent(self, event):
        # Возвращаем цвет кнопки при уходе курсора
        self.setIcon(QIcon(f'{self.path}.png'))
        super().leaveEvent(event)

class FirstNewChatButton(QPushButton):
        def __init__(self, parent=None):
            super().__init__(parent)
            self.setFixedSize(200, 40)
            self.move(200, 40)
            self.setStyleSheet('''QPushButton {background-color: rgba(255, 255, 255, 0.1); color:rgba(255, 255, 255, 0.6); 
                                                            font-weight: bold; border:none; font-size: 11px; border-radius: 10px;}
                                            QPushButton:hover{background-color: rgba(255, 255, 255, 0.2);}''')
            self.setCursor(QCursor(Qt.PointingHandCursor))


class UserWidget(QWidget):
    '''Базовая информация о пользователе. '''

    def __init__(self, parent=None):
        super().__init__(parent)

        self.setContentsMargins(0,0,0,0)
        self.setStyleSheet('background-color: rgba(0, 0, 0, 0); border: none;')

        self.avatar = QPushButton()
        self.avatar.setContentsMargins(0,0,0,0)
        self.avatar.setFixedSize(40, 40)
        self.avatar.setStyleSheet('''QPushButton {background-color: grey; border-radius: 20px;}''')
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
        self.data_layout.setContentsMargins(0,0,0,0)

        self.data_layout.addWidget(self.avatar)
        self.data_layout.addLayout(profile_info_layout)

        self.setLayout(self.data_layout)

class DarkenButton(QPushButton):
    imageSelected = Signal(str)

    def __init__(self, size_btn: int, path, rounded=20):
        super().__init__()
        self.last_item = path
        self.size_btn = size_btn
        self.rounded = rounded
        self.clicked.connect(self.open_file_dialog)
        self.file_list = QListWidget()
        self.original_pixmap = QPixmap(path)
        self.overlay_pixmap = QPixmap('static/image/camera.png')  # Второе изображение для наложения
        
        self.setStyleSheet('background-color: rgba(255,255,255, 0);')
        self.border_icon = get_rounds_edges_image(self, self.original_pixmap)
        self.setIconSize(QSize(self.size_btn, self.size_btn))
        self.setIcon(QIcon(self.border_icon))
    
    def enterEvent(self, event):
        darkened_pixmap = self.border_icon.copy()
        painter = QPainter(darkened_pixmap)
        # Добавляем затемнение
        painter.fillRect(darkened_pixmap.rect(), QColor(0, 0, 0, 100))
        
        # Накладываем второе изображение поверх
        overlay_size = QSize(400, 400)  # Определяем размер второго изображения
        scaled_overlay = self.overlay_pixmap.scaled(overlay_size, Qt.KeepAspectRatio, Qt.SmoothTransformation)  # Изменяем размер наложенного изображения
        painter.drawPixmap(
            (darkened_pixmap.width() - overlay_size.width()) // 2,  # По центру
            (darkened_pixmap.height() - overlay_size.height()) // 2,
            scaled_overlay
        )

        rounded_pixmap = get_rounds_edges_image(self, darkened_pixmap, self.rounded)
        
        painter.end()
        self.setIcon(QIcon(rounded_pixmap))  # Устанавливаем иконку с наложением
        super().enterEvent(event)
    
    def leaveEvent(self, event):
        self.setIcon(QIcon(self.border_icon))  # Возвращаем оригинальную иконку
        super().leaveEvent(event)
    
    def open_file_dialog(self):
        dialog = QFileDialog(self)
        dialog.setFileMode(QFileDialog.FileMode.ExistingFiles)
        dialog.setNameFilter("Images (*.png *.jpg)")
        dialog.setViewMode(QFileDialog.ViewMode.List)
        if dialog.exec():
            filenames = dialog.selectedFiles()
            if filenames:
                self.file_list.addItems([str(Path(filename)) for filename in filenames])
                
                last_item_index = self.file_list.count() - 1
                if last_item_index >= 0:
                    self.last_item = self.file_list.item(last_item_index)
                    self.switch_image(self.last_item.text())
                    self.imageSelected.emit(self.last_item.text())
                    
    
    def switch_image(self, path):
        # Загружаем новое изображение и обновляем иконку
        self.original_pixmap = QPixmap(path)
        self.border_icon = get_rounds_edges_image(self, self.original_pixmap)
        self.setIcon(QIcon(self.border_icon))  # Устанавливаем новое изображение как иконку
