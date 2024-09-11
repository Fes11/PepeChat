from PySide6.QtWidgets import QPushButton, QApplication
from PySide6.QtGui import QPixmap, QPainter, QIcon, QColor
from PySide6.QtCore import QSize, QRect, Qt
import sys

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
        overlay_size = self.overlay_pixmap.size()
        painter.drawPixmap(
            (darkened_pixmap.width() - overlay_size.width()) // 2,  # По центру
            (darkened_pixmap.height() - overlay_size.height()) // 2,
            self.overlay_pixmap
        )
        
        painter.end()
        self.setIcon(QIcon(darkened_pixmap))  # Устанавливаем иконку с наложением
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
        painter.drawRoundedRect(QRect(0, 0, size.width(), size.height()), 30, 30)
        painter.end()

        return rounded_pixmap

app = QApplication(sys.argv)
button = DarkenButton()
button.show()
sys.exit(app.exec())
