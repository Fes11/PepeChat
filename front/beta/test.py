from PySide6.QtWidgets import QApplication, QLabel, QVBoxLayout, QWidget
from PySide6.QtGui import QPixmap
from PySide6.QtCore import Qt, QMimeData
import sys
import os

# Drag and drop
class ImageDropWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Drag and Drop Image")
        self.setAcceptDrops(True)  # Включаем поддержку drop

        self.layout = QVBoxLayout()
        self.label = QLabel("Drag an image here")
        self.label.setAlignment(Qt.AlignCenter)
        self.layout.addWidget(self.label)
        self.setLayout(self.layout)

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():  # Проверяем, содержит ли событие перетаскивания файлы
            event.acceptProposedAction()

    def dropEvent(self, event):
        if event.mimeData().hasUrls():
            for url in event.mimeData().urls():
                file_path = url.toLocalFile()  # Получаем локальный путь к файлу
                if os.path.splitext(file_path)[1].lower() in ['.png', '.jpg', '.jpeg', '.bmp']:  # Проверка формата изображения
                    self.display_image(file_path)

    def display_image(self, image_path):
        pixmap = QPixmap(image_path)
        self.label.setPixmap(pixmap.scaled(self.label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ImageDropWidget()
    window.resize(400, 300)
    window.show()
    sys.exit(app.exec())
