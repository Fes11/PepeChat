from PySide6.QtWidgets import (
    QApplication, QMainWindow, QScrollArea, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QGridLayout
)
from PySide6.QtGui import QPixmap
from PySide6.QtCore import Qt
import sys


class ImageGallery(QScrollArea):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWidgetResizable(True)
        
        # Основной виджет и его макет
        self.container = QWidget()
        self.setWidget(self.container)
        self.layout = QGridLayout()
        self.container.setLayout(self.layout)

        # Настройки сетки
        self.image_size = 100
        self.max_width = 300
        self.column_count = self.max_width // self.image_size

        self.row = 0
        self.column = 0

    def add_image(self, image_path):
        # Создаем QLabel для изображения
        pixmap = QPixmap(image_path).scaled(
            self.image_size, self.image_size, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation
        )
        label = QLabel()
        label.setPixmap(pixmap)
        label.setFixedSize(self.image_size, self.image_size)
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Добавляем в сетку
        self.layout.addWidget(label, self.row, self.column)

        # Обновляем положение
        self.column += 1
        if self.column >= self.column_count:
            self.column = 0
            self.row += 1


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Image Gallery")
        self.setGeometry(100, 100, 320, 480)

        # Основной виджет
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Макет
        layout = QVBoxLayout(central_widget)

        # Галерея изображений
        self.gallery = ImageGallery()
        layout.addWidget(self.gallery)

        # Кнопка для добавления изображений
        add_button = QPushButton("Add Image")
        add_button.clicked.connect(self.add_image)
        layout.addWidget(add_button)

    def add_image(self):
        # Пример пути к изображению
        image_path = "static/image/ava3.jpg"  # Укажите свой путь
        self.gallery.add_image(image_path)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
