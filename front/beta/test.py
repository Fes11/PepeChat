from window import Window
from PySide6.QtWidgets import QApplication, QWidget, QLabel, QVBoxLayout
from PySide6.QtCore import QRect, Qt, QPropertyAnimation
from PySide6.QtGui import QBrush, QColor
import sys

from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QMessageBox
from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput
from PySide6.QtMultimediaWidgets import QVideoWidget
from PySide6.QtCore import QUrl, QTimer
import sys
import os

class LoadingWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Загрузка")
        self.setGeometry(100, 100, 640, 480)

        # Создаем видео-виджет для воспроизведения видео
        self.video_widget = QVideoWidget(self)
        self.player = QMediaPlayer(self)
        self.audio_output = QAudioOutput(self)
        self.player.setAudioOutput(self.audio_output)
        self.player.setVideoOutput(self.video_widget)

        # Проверяем наличие видеофайла
        video_path = "static/loading.mp4"
        if not os.path.exists(video_path):
            QMessageBox.critical(self, "Ошибка", f"Видеофайл не найден: {video_path}")
            sys.exit(1)

        # Загружаем видео
        video_url = QUrl.fromLocalFile(os.path.abspath(video_path))
        self.player.setSource(video_url)

        # Настраиваем макет
        layout = QVBoxLayout(self)
        layout.addWidget(self.video_widget)

        # Подключаем сигналы
        self.player.errorOccurred.connect(self.handle_error)
        self.player.mediaStatusChanged.connect(self.handle_media_status)

        # Запуск воспроизведения видео
        self.player.play()

    def handle_error(self, error):
        QMessageBox.critical(self, "Ошибка воспроизведения", self.player.errorString())
        sys.exit(1)

    def handle_media_status(self, status):
        if status == QMediaPlayer.MediaStatus.EndOfMedia:
            self.close()
            self.show_main_window()



if __name__ == "__main__":
    app = QApplication([])
    
    window = Window()
    window.main_layout.addWidget(LoadingWindow())
    window.show()
    app.exec()
