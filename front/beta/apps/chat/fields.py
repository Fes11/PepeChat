from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QFontMetrics, QTextDocument
from PySide6.QtWidgets import (QTextEdit, QSizePolicy, QLabel)

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

class PlainTextEdit(QTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)

    def insertFromMimeData(self, source):
        # Вставляем только обычный текст, игнорируя форматирование
        plain_text = source.text()
        self.insertPlainText(plain_text)

class MessageBubble(QLabel):
    def __init__(self, text, min_size=(100, 30), max_size=(400, 3000), parent=None):
        super().__init__(parent)
        self.min_width, self.min_height = min_size
        self.max_width, self.max_height = max_size

        # Устанавливаем текст и параметры стиля для бабла
        self.setText(text)
        self.setWordWrap(True)
        self.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Preferred)

        # Вызываем функцию адаптации под размер текста
        self.adjust_size()

    def adjust_size(self):
        # Создаем текстовый документ для расчета размеров
        doc = QTextDocument()
        doc.setDefaultFont(self.font())
        doc.setPlainText(self.text())

        # Устанавливаем максимальную ширину для переноса строк
        doc.setTextWidth(self.max_width)

        # Получаем размеры текста
        text_size = doc.size()

        # Добавляем padding для предотвращения обрезания
        padding = 20

        # Вычисляем новые размеры с учетом минимальных и максимальных границ
        new_width = min(max(self.min_width, text_size.width() + padding), self.max_width)
        new_height = min(max(self.min_height, text_size.height() + padding), self.max_height)

        # Устанавливаем новый размер
        self.setFixedSize(new_width, new_height)



