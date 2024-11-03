from datetime import datetime
from PySide6.QtGui import QIcon, QPixmap, QMovie, QCursor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QVBoxLayout, QLabel, QHBoxLayout, QWidget, QPushButton)
from apps.chat.style import NOT_USER_BUBLS, TEXT_COLOR
from apps.profile.profile import Avatar
from utils.media_view import MediaView
from image import get_top_rounded_image


class Message(QHBoxLayout):
    '''Объединяет все в полную строку сообщения с баблом и аватаром.'''

    def __init__(self, text, i, path='') -> None:
        super(Message, self).__init__()
        self.text = text
        self.path = path

        mes_avatar = Avatar(path='static/image/person.png')
        me_avatar = Avatar(path='static/image/ava.png')

        avatar_layout = QVBoxLayout()
        avatar_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        message = QLabel(self.text)
        message.setWordWrap(True)
        message.adjustSize()
        message.setTextInteractionFlags(Qt.TextSelectableByMouse)
        message.setMaximumWidth(500)
        message.setStyleSheet('''font-size: 14px; background: rgba(0, 0, 0, 0); font-weight: medium;''')

        if i % 2:
            message_bubble = MessageBubble(me=True, message=message, path=path)
            self.setAlignment(Qt.AlignmentFlag.AlignRight)
            self.addWidget(message_bubble)

            avatar_layout.addWidget(me_avatar)
            self.addLayout(avatar_layout)
        else:
            message_bubble = MessageBubble(me=False, message=message, path=path)
            avatar_layout.addWidget(mes_avatar)
            self.addLayout(avatar_layout)
            self.addWidget(message_bubble)
            self.setAlignment(Qt.AlignmentFlag.AlignLeft)


class MessageBubble(QWidget):
    '''Бабл сообщений.
       me - сообщение отправляю я или собеседник.
       message - тест сообщения.
       path - если он не пустой, то картинка отправиться в сообщении.'''
    
    def __init__(self, me: bool, message, path='') -> None:
        super(MessageBubble, self).__init__()
        self.me = me
        self.message = message
        self.path = path

        self.setContentsMargins(0,0,0,0)
        widget = QWidget()
        layout = QHBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0,0,0,0)

        message_buble_layout = QVBoxLayout()
        message_buble_layout.setSpacing(0)
        message_buble_layout.setContentsMargins(0,0,0,0)

        if self.path:
            if self.path[-3:] == 'gif':
                self.label = QLabel()
                self.label.setStyleSheet('background-color: rgba(0, 0, 0, 0)')
                self.movie = QMovie(self.path)
                self.movie.setScaledSize(QSize(300, 300))
                self.label.setMovie(self.movie)
                message_buble_layout.addWidget(self.label)
                self.movie.start()  # Начинаем проигрывать GIF
            else:
                image = QPushButton()
                image.setCursor(QCursor(Qt.PointingHandCursor))
                image.setStyleSheet('background-color: rgba(0, 0, 0, 0)')
                original_pixmap = QPixmap(path)
                image.setIcon(QIcon(get_top_rounded_image(original_pixmap, radius=28)))
                image.setIconSize(QSize(300, 300))
                image.clicked.connect(self.open_media_view)
                message_buble_layout.addWidget(image)

            widget.setFixedWidth(300) # Нужно будет переделать так, что ширина ровняется ширине картинки

        # Метка времени
        mes_time = QLabel(datetime.now().strftime('%H:%M'))
        mes_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.65); background: rgba(0, 0, 0, 0);}')

        mes_time_layout = QVBoxLayout()
        mes_time_layout.setContentsMargins(0,0,0,0)
        mes_time_layout.setAlignment(Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignRight)
        mes_time_layout.addWidget(mes_time)
        
        message_layout = QHBoxLayout()
        message_layout.setSpacing(10)
        message_layout.setContentsMargins(10,7,10,7)
        message_layout.addWidget(self.message)
        message_layout.addLayout(mes_time_layout)

        message_buble_layout.addLayout(message_layout)
        widget.setLayout(message_buble_layout)
 
        if self.me == True:
            widget.setStyleSheet('''
                        border-top-left-radius: 12px;
                        border-top-right-radius: 12px;
                        border-bottom-left-radius: 12px;
                        border-bottom-right-radius: 0px;
                        color: white;
                        background-color: rgba(123, 97, 255, 1);''')
        else:
            widget.setStyleSheet(f'''
                        border-top-left-radius: 12px;
                        border-top-right-radius: 12px;
                        border-bottom-left-radius: 0px;
                        border-bottom-right-radius: 12px;
                        color: {TEXT_COLOR};
                        background-color: {NOT_USER_BUBLS};''')

        layout.addWidget(widget)
        self.setLayout(layout)

    def open_media_view(self):
        window = MediaView(self.path)
        window.show()