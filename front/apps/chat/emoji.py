from PySide6.QtWidgets import QWidget, QGridLayout, QPushButton
from PySide6.QtCore import Qt
from PySide6.QtGui import QCursor


class EmojiPicker(QWidget):
    def __init__(self, parent=None, message_edit=None):
        super().__init__(parent)
        self.message_edit = message_edit

        self.setWindowFlags(Qt.Popup)  # Окно закрывается при клике вне его
        self.setLayout(QGridLayout())
        self.setStyleSheet('''QPushButton {border:none;}
                              QPushButton:hover {background-color: rgba(255, 255, 255, 0.1);}''')

        # Добавляем кнопки-смайлики
        emojis = ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊"]  # Пример
        for i, emoji in enumerate(emojis):
            btn = QPushButton(emoji)
            btn.setCursor(QCursor(Qt.PointingHandCursor))
            btn.setStyleSheet("font-size: 20px;")
            btn.clicked.connect(lambda _, e=emoji: self.on_emoji_selected(e))
            self.layout().addWidget(btn, i // 5, i % 5)  # Сетка 5xN

    def on_emoji_selected(self, emoji):
        self.message_edit.insertPlainText(emoji)
        self.message_edit.setFocus()
        self.hide()  # Закрываем окно после выбора
