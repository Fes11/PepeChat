from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QSizePolicy)

class WrapLabel(QTextEdit):
    def __init__(self, text=''):
        super().__init__(text)
        self.setReadOnly(True)
        self.setStyleSheet('''QTextEdit {color: white;}''')
        self.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Maximum)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.textChanged.connect(self.updateGeometry)

    def minimumSizeHint(self):
        doc = self.document().clone()
        doc.setTextWidth(self.viewport().width())
        height = doc.size().height()
        height += self.frameWidth() * 2
        return QSize(150, height)

    def sizeHint(self):
        return self.minimumSizeHint()

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.updateGeometry()
