import sys
from PySide6.QtWidgets import QApplication
from apps.chat.chat_window import MainWindow
from window import Window
from BlurWindow.blurWindow import blur

if __name__ == '__main__':
    app = QApplication(sys.argv)

    window = MainWindow()
    window.show()

    # window2 = Window()
    # window2.show()

    app.exec()
