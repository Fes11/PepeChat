import sys
from PySide6.QtWidgets import QApplication
from apps.chat.chat_window import MainWindow
from apps.authorization.login import LoginWindow
from window import Window
from BlurWindow.blurWindow import blur

if __name__ == '__main__':
    app = QApplication(sys.argv)

    window = Window()
    window.main_layout.addWidget(LoginWindow())
    window.show()

    app.exec()
