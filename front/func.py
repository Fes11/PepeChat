
from pathlib import Path
from PySide6.QtGui import QIcon, QCursor, QPixmap, QPainter, QColor, QBitmap
from PySide6.QtCore import Qt, QSize, QRect
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QFileDialog,
                               QHBoxLayout, QWidget, QPushButton, QListWidget)

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
