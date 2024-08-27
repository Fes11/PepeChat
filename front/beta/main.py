import sys
from PySide6.QtWidgets import QApplication
from apps.chat.chat_window import MainWindow
from apps.authorization.login import LoginWindow
from window import Window
from BlurWindow.blurWindow import blur

if __name__ == '__main__':
    app = QApplication(sys.argv)

    window = LoginWindow()
    window.show()

    # window2 = Window()
    # window2.show()

    app.exec()
