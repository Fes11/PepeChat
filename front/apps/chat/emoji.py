from PySide6.QtWidgets import QWidget, QGridLayout, QPushButton, QScrollArea, QVBoxLayout, QHBoxLayout
from PySide6.QtCore import Qt
from PySide6.QtGui import QCursor
from apps.chat.style import BG_COLOR, MAIN_BOX_COLOR


class EmojiPicker(QWidget):
    def __init__(self, parent=None, message_edit=None):
        super().__init__(parent)
        self.message_edit = message_edit

        # Настройка окна
        self.setWindowFlags(Qt.Popup)  # Окно закрывается при клике вне его
        self.setFixedSize(240, 300)  # Размер окна

        # Основной макет
        widget = QWidget()
        widget.setStyleSheet(f'''QWidget {{
                background-color: {BG_COLOR};
                border-radius: 10px;
            }}''')
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)


        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(5,5,5,5)

        top_panel_layout = QHBoxLayout()
        top_panel_layout.setContentsMargins(0,0,0,0)

        self.emoji_btn = QPushButton('Emoji')
        self.emoji_btn.setFixedHeight(25)
        self.emoji_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.emoji_btn.setStyleSheet(f'''
            QPushButton {{
                border: none; font-size: 16px; color: grey;
            }}
            QPushButton:hover {{
                background-color: rgba(200, 200, 200, 0.1);
                color: white;
            }}
        ''')
        top_panel_layout.addWidget(self.emoji_btn)

        self.webm_btn = QPushButton('Webm')
        self.webm_btn.setFixedHeight(25)
        self.webm_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.webm_btn.setStyleSheet(f'''
            QPushButton {{
                border: none; font-size: 16px; color: grey;
            }}
            QPushButton:hover {{
                background-color: rgba(200, 200, 200, 0.1);
                color: white;
            }}
        ''')
        top_panel_layout.addWidget(self.webm_btn)

        main_layout.addLayout(top_panel_layout)

        # Создаём область прокрутки
        scroll_area = QScrollArea(self)
        scroll_area.setWidgetResizable(True)
        scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll_area.setStyleSheet("border: none;")

        # Виджет для смайликов
        emoji_widget = QWidget()
        emoji_layout = QGridLayout(emoji_widget)
        emoji_layout.setContentsMargins(0, 0, 0, 0)
        emoji_layout.setSpacing(5)

        # Заполнение смайликами
        with open("static/emoji.txt", "r", encoding="utf-8") as file:
            emojis = file.read()

        for i, emoji in enumerate(emojis.split(',')):
            btn = QPushButton(emoji)
            btn.setCursor(QCursor(Qt.PointingHandCursor))
            btn.setFixedWidth(40)
            btn.setStyleSheet(f'''
            QPushButton {{
                border: none; font-size: 20px; color: grey;
            }}
            QPushButton:hover {{
                background-color: rgba(200, 200, 200, 0.1);
                color: white;
            }}''')
            btn.clicked.connect(lambda _, e=emoji: self.on_emoji_selected(e))
            emoji_layout.addWidget(btn, i // 5, i % 5)  # Сетка 5xN

        emoji_widget.setLayout(emoji_layout)
        scroll_area.setWidget(emoji_widget)

        main_layout.addWidget(scroll_area)
        widget.setLayout(main_layout)

        layout.addWidget(widget)

        self.setLayout(layout)

    def on_emoji_selected(self, emoji):
        self.message_edit.insertPlainText(emoji)
        self.message_edit.setFocus()
        self.hide()  # Закрываем окно после выбора
