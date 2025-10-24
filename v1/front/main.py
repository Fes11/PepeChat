import sys
from PySide6.QtWidgets import QApplication
from apps.chat.window import ChatScreen
from window import Window


if __name__ == '__main__':
    app = QApplication(sys.argv)

    window = Window()
    window.main_layout.addWidget(ChatScreen(window))
    # window = MediaView()
    window.show()

    app.exec()
