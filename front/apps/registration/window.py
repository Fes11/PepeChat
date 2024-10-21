from PySide6.QtCore import Qt
from PySide6.QtWidgets import (QVBoxLayout, QWidget)

class RegScreen(QWidget):
    '''Основное окно чата.'''
    def __init__(self, parent=None):
        super(RegScreen, self).__init__(parent)

        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.setLayout(layout)
