import sys
import ctypes
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget
from PySide6.QtCore import QTimer, Qt

user32 = ctypes.windll.user32

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Отслеживание клика на иконку панели задач")
        self.resize(300, 200)

        widget = QWidget()
        widget.setFixedSize(300,300)
        widget.setStyleSheet('background-color: red;')

        self.setAutoFillBackground(False)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)

        # Флаг для отслеживания состояния окна
        self.is_hidden = False

        # Таймер для периодического отслеживания состояния окна
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.check_window_state)
        self.timer.start(1)  # Проверка каждые 100 мс

        self.setCentralWidget(widget)

    def check_window_state(self):
        # Проверяем, является ли текущее окно активным
        active_window = user32.GetForegroundWindow()
        if active_window == self.winId().__int__():
            if self.is_hidden:
                self.showNormal()
                self.is_hidden = False
        else:
            if not self.is_hidden:
                self.showMinimized()
                self.is_hidden = True

if __name__ == "__main__":
    app = QApplication(sys.argv)

    window = MainWindow()
    window.show()

    sys.exit(app.exec())
