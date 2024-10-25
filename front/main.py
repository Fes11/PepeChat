import sys
from PySide6.QtWidgets import QApplication
from apps.chat.window import ChatScreen
from apps.authorization.login import LoginScreen
from window import Window
from apps.chat.chat_area import MessagesList
if __name__ == '__main__':
    app = QApplication(sys.argv)

    window = Window()
    window.main_layout.addWidget(ChatScreen())
    window.show()

    app.exec()
