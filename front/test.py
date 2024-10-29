from PySide6.QtWidgets import QApplication, QLabel, QWidget, QVBoxLayout
from PySide6.QtGui import QMovie
import sys
from PySide6.QtCore import Qt

class GifPlayer(QWidget):
    def __init__(self, gif_path):
        super().__init__()
        self.setWindowTitle("GIF Player")

        # Создаем QLabel для отображения GIF
        self.label = QLabel(self)
        self.label.setAlignment(Qt.AlignCenter)

        # Загружаем и запускаем анимацию
        self.movie = QMovie(gif_path)
        self.label.setMovie(self.movie)
        self.movie.start()  # Начинаем проигрывать GIF

        # Добавляем QLabel в компоновку
        layout = QVBoxLayout()
        layout.addWidget(self.label)
        self.setLayout(layout)

app = QApplication(sys.argv)
window = GifPlayer("static/image/cat.gif")  # Укажите путь к вашему GIF-файлу
window.resize(400, 400)
window.show()
sys.exit(app.exec())
