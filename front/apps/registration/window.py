from apps.chat.fields import FirstNewChatButton
from apps.chat.chat_list import Sidebar
from apps.chat.dialog import CreateChatDialog
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (QVBoxLayout,QHBoxLayout, QWidget, QStackedWidget)

class RegWindow(QWidget):
    '''Основное окно чата.'''
    def __init__(self, parent=None):
        super(RegWindow, self).__init__(parent)

        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.setLayout(layout)