from pathlib import Path
from PySide6.QtGui import QIcon, QCursor, QPixmap, QPainter, QColor, QPainterPath
from PySide6.QtCore import Qt, QSize, QRectF, QRect
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QFileDialog,
                               QHBoxLayout, QWidget, QPushButton, QGraphicsOpacityEffect)


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

        self.avatar = ImageChanger(size=40, rounded=100, path='static/image/ava.png', active=False)
        self.avatar.setContentsMargins(0,0,0,0)
        self.avatar.setFixedSize(40, 40)
        self.avatar.setStyleSheet('''QPushButton {background-color: grey; border-radius: 20px;}''')
        self.avatar.setCursor(QCursor(Qt.PointingHandCursor))

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


class ImageChanger(QLabel):
    def __init__(self, size=100, rounded=20, path='static/image/person.png', active=True, chat_model=None, parent=None):
        super().__init__(parent)
        self.setFixedSize(size, size)
        self.setCursor(Qt.PointingHandCursor if active else Qt.ArrowCursor)
        self.path = path
        self.chat_model = chat_model

        self.rounded = rounded  # Радиус скругления
        self.active = active  # Флаг активности
        
        self.current_pixmap = self.load_image(self.path)
        
        self.setAcceptDrops(active)  # Drag & Drop только если активен

    def update_image_path(self, new_path):
        self.path = new_path
        if self.chat_model:
            self.chat_model.avatar_path = new_path

    def load_image(self, file_path):
        """Загружает изображение с указанного пути."""
        self.update_image_path(file_path)
        pixmap = QPixmap(file_path)
        self.setPixmap(pixmap)
        return pixmap

    def paintEvent(self, event):
        """Рисует аватар с закругленными краями."""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)

        if not self.current_pixmap or self.current_pixmap.isNull():
            return

        path = QPainterPath()
        path.addRoundedRect(QRectF(self.rect()), self.rounded, self.rounded)
        painter.setClipPath(path)

        # Центрируем изображение
        scaled_pixmap = self.current_pixmap.scaled(self.size(), Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)
        target_rect = QRect(0, 0, self.width(), self.height())
        source_rect = QRect((scaled_pixmap.width() - self.width()) // 2, 
                            (scaled_pixmap.height() - self.height()) // 2,
                            self.width(), self.height())

        painter.drawPixmap(target_rect, scaled_pixmap, source_rect)

    def mousePressEvent(self, event):
        """Вызывает диалог выбора файла при клике, если активен."""
        if not self.active:
            return
        if event.button() == Qt.LeftButton:
            file_path, _ = QFileDialog.getOpenFileName(self, "Выберите изображение", "", "Images (*.png *.jpg *.jpeg)")
            if file_path:
                self.set_avatar(file_path)

    def set_avatar(self, file_path):
        """Загружает изображение и делает его с закругленными краями."""
        self.current_pixmap = self.load_image(file_path)
        # Обрезаем изображение в квадрат и масштабируем
        size = min(self.current_pixmap.width(), self.current_pixmap.height())
        rect = QRect((self.current_pixmap.width() - size) // 2, (self.current_pixmap.height() - size) // 2, size, size)
        pixmap = self.current_pixmap.copy(rect).scaled(self.size(), Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)

        # Создаем круглую версию изображения
        self.setPixmap(self.create_rounded_pixmap(pixmap))


    def create_rounded_pixmap(self, pixmap):
        """Обрезает изображение с закругленными углами и возвращает `QPixmap`."""
        size = min(self.width(), self.height())
        rounded_pixmap = QPixmap(size, size)
        rounded_pixmap.fill(Qt.transparent)

        painter = QPainter(rounded_pixmap)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)

        path = QPainterPath()
        path.addRoundedRect(QRectF(0, 0, size, size), self.rounded, self.rounded)
        painter.setClipPath(path)
        painter.drawPixmap(0, 0, size, size, pixmap)
        painter.end()

        return rounded_pixmap

    # === DRAG & DROP ===
    def dragEnterEvent(self, event):
        """Разрешаем перетаскивание только если активен."""
        if self.active and event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event):
        """Обрабатываем перетаскивание файла, если активен."""
        if not self.active:
            return
        urls = event.mimeData().urls()
        if urls:
            file_path = urls[0].toLocalFile()
            self.set_avatar(file_path)
    
    def enterEvent(self, event):
        """Затемняет изображение при наведении, если активен."""
        if self.active:
            self.setGraphicsEffect(self.get_hover_effect(0.5))  # Затемняем до 60%
        super().enterEvent(event)

    def leaveEvent(self, event):
        """Убирает затемнение при уходе курсора."""
        if self.active:
            self.setGraphicsEffect(None)
        super().leaveEvent(event)

    def get_hover_effect(self, opacity):
        """Возвращает эффект затемнения."""
        effect = QGraphicsOpacityEffect(self)
        effect.setOpacity(opacity)
        return effect

