from datetime import datetime
from PySide6.QtGui import QIcon, QPixmap, QMovie, QCursor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QVBoxLayout, QLabel, QHBoxLayout, QWidget, QPushButton)
from apps.chat.style import NOT_USER_BUBLS, TEXT_COLOR, MAIN_COLOR
from apps.profile.profile import Avatar
from utils.media_view import MediaView
from image import get_rounds_edges_image


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

        message_layout = QHBoxLayout()
        message_layout.setSpacing(10)
        message_layout.setContentsMargins(10,7,10,7)

        message_buble_layout = QVBoxLayout()
        message_buble_layout.setSpacing(0)
        message_buble_layout.setContentsMargins(0,0,0,0)

        # Метка времени
        mes_time = QLabel(datetime.now().strftime('%H:%M'))
        mes_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.65); background: rgba(0, 0, 0, 0);}')

        mes_time_layout = QVBoxLayout()
        mes_time_layout.setContentsMargins(0,0,0,0)
        mes_time_layout.setAlignment(Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignRight)
        mes_time_layout.addWidget(mes_time)

        if self.path:
            if self.path[-3:] == 'gif':
                gif = GifBubble(mes_time, self.path)

                message_buble_layout.addWidget(gif)
                widget.setLayout(message_buble_layout)
                layout.addWidget(widget)
            else:
                image_bubbl = ImageBubble(mes_time, self.path)
                image_bubbl.clicked.connect(self.open_media_view)

                message_buble_layout.addWidget(image_bubbl)
                widget.setLayout(message_buble_layout)
                layout.addWidget(widget)

            widget.setFixedWidth(300) # Нужно будет переделать так, что ширина ровняется ширине картинки
        else:            
            message_layout.addWidget(self.message)
            message_layout.addLayout(mes_time_layout)

            message_buble_layout.addLayout(message_layout)
            widget.setLayout(message_buble_layout)
    
            if self.me == True:
                widget.setStyleSheet(f'''
                            border-top-left-radius: 12px;
                            border-top-right-radius: 12px;
                            border-bottom-left-radius: 12px;
                            border-bottom-right-radius: 0px;
                            color: white;
                            background-color: {MAIN_COLOR};''')
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


class GifBubble(QLabel):
    def __init__(self, time, path) -> None:
        super(GifBubble, self).__init__()
        self.time = time 
        self.path = path

        self.setStyleSheet('background-color: rgba(0, 0, 0, 0)')
        movie = QMovie(self.path)
        movie.setScaledSize(QSize(300, 300))
        self.setMovie(movie)

        time = QLabel(self.time.text())
        time.setFixedSize(50, 22)
        time.setStyleSheet(f'background-color: rgba(0,0,0,0.5); color: white; padding: 5px; border-radius: 10px; font-size: 12px; font-weight: bold;')

        time_layout = QVBoxLayout()
        time_layout.setAlignment(Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignRight)
        time_layout.addWidget(time)
        self.setLayout(time_layout)
        movie.start()  # Начинаем проигрывать GIF


class ImageBubble(QPushButton):
    def __init__(self, time, path) -> None:
        super(ImageBubble, self).__init__()
        self.time = time
        self.path = path

        time = QLabel(self.time.text())
        time.setFixedSize(50, 22)
        time.setStyleSheet('background-color: rgba(0,0,0,0.5); color: white; padding: 5px; border-radius: 10px; font-size: 12px; font-weight: bold;')

        time_layout = QVBoxLayout()
        time_layout.setAlignment(Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignRight)
        time_layout.addWidget(time)
        self.setLayout(time_layout)

        self.setCursor(QCursor(Qt.PointingHandCursor))
        self.setStyleSheet('background-color: rgba(0, 0, 0, 0)')
        original_pixmap = QPixmap(path)
        self.setIcon(QIcon(get_rounds_edges_image(self, original_pixmap, rounded=20)))
        self.setIconSize(QSize(300, 300))


class TextBubble(QPushButton):
    def __init__(self) -> None:
        super(TextBubble, self).__init__()
        pass
