from datetime import datetime
from PySide6.QtGui import QIcon, QPixmap, QMovie, QCursor, QAction
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QVBoxLayout, QLabel, QHBoxLayout, QWidget, QPushButton, QMenu)
from apps.chat.style import NOT_USER_BUBLS, TEXT_COLOR, MAIN_COLOR, MAIN_BOX_COLOR
from apps.profile.profile import Avatar
from utils.media_view import MediaView
from image import get_rounds_edges_image


class Message(QHBoxLayout):
    '''Объединяет все в полную строку сообщения с баблом и аватаром.'''

    def __init__(self, text, i, path='') -> None:
        super(Message, self).__init__()
        self.text = text
        self.path = path
        self.index = i

        self.mes_avatar = Avatar(path='static/image/person.png')
        self.me_avatar = Avatar(path='static/image/ava.png')
        self.me_left_avatar = Avatar(path='static/image/ava.png')
        self.me_left_avatar.setVisible(False)  # Изначально скрыта

        # Создаем avatar_layout как атрибут экземпляра класса
        self.avatar_layout = QVBoxLayout()
        self.avatar_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        self.avatar_left_layout = QVBoxLayout()
        self.avatar_left_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)
        self.avatar_left_layout.addWidget(self.me_left_avatar)  # Аватарка слева (скрыта)

        self.message = QLabel(self.text)
        self.message.setContextMenuPolicy(Qt.NoContextMenu)
        self.message.setWordWrap(True)
        self.message.adjustSize()
        self.message.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.message.setMaximumWidth(500)
        self.message.setStyleSheet('''font-size: 14px; background: rgba(0, 0, 0, 0); font-weight: medium;''')

        # Определяем, сообщение от текущего пользователя или нет
        self.is_user_message = i % 2 == 1  # True для сообщений текущего пользователя
        self.message_bubble = MessageBubble(me=self.is_user_message, message=self.message, path=path)
        
        if self.is_user_message:
            # Сообщение текущего пользователя (справа)
            self.setAlignment(Qt.AlignmentFlag.AlignRight)
            self.addLayout(self.avatar_left_layout)
            self.addWidget(self.message_bubble)
            self.avatar_layout.addWidget(self.me_avatar)  # Аватарка справа
            self.addLayout(self.avatar_layout)
        else:
            # Сообщение другого пользователя (слева)
            self.setAlignment(Qt.AlignmentFlag.AlignLeft)
            self.avatar_layout.addWidget(self.mes_avatar)  # Аватарка слева
            self.addLayout(self.avatar_layout)
            self.addWidget(self.message_bubble)

    def set_alignment(self, align_left: bool):
        '''Меняет расположение сообщения и аватарки в зависимости от ширины окна.'''

        if self.is_user_message:
            # Меняем расположение и видимость для текущего пользователя
            if align_left:
                self.setAlignment(Qt.AlignmentFlag.AlignLeft)
                self.me_avatar.setVisible(False)
                self.me_left_avatar.setVisible(True)
                
                self.message_bubble.widget.setStyleSheet(f'''
                            border-top-left-radius: 12px;
                            border-top-right-radius: 12px;
                            border-bottom-left-radius: 0px;
                            border-bottom-right-radius: 12px;
                            color: white;
                            background-color: {MAIN_COLOR};''')
            else:
                self.setAlignment(Qt.AlignmentFlag.AlignRight)
                self.me_left_avatar.setVisible(False)
                self.me_avatar.setVisible(True)

                self.message_bubble.widget.setStyleSheet(f'''
                            border-top-left-radius: 12px;
                            border-top-right-radius: 12px;
                            border-bottom-left-radius: 12px;
                            border-bottom-right-radius: 0px;
                            color: white;
                            background-color: {MAIN_COLOR};''')


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
        self.widget = QWidget()
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
                self.widget.setLayout(message_buble_layout)
                layout.addWidget(self.widget)
            else:
                image_bubbl = ImageBubble(mes_time, self.path)
                image_bubbl.clicked.connect(self.open_media_view)
                message_buble_layout.addWidget(image_bubbl)

                if self.message.text():
                    message_layout.addWidget(self.message)
                    message_buble_layout.addLayout(message_layout)

                    if self.me == True:
                        self.widget.setStyleSheet(f'''
                                    border-top-left-radius: 12px;
                                    border-top-right-radius: 12px;
                                    border-bottom-left-radius: 12px;
                                    border-bottom-right-radius: 0px;
                                    color: white;
                                    background-color: {MAIN_COLOR};''')
                    else:
                        self.widget.setStyleSheet(f'''
                                    border-top-left-radius: 12px;
                                    border-top-right-radius: 12px;
                                    border-bottom-left-radius: 0px;
                                    border-bottom-right-radius: 12px;
                                    color: {TEXT_COLOR};
                                    background-color: {NOT_USER_BUBLS};''')
                    
                self.widget.setLayout(message_buble_layout)
                layout.addWidget(self.widget)

            self.widget.setFixedWidth(300) # Нужно будет переделать так, что ширина ровняется ширине картинки
        else:            
            message_layout.addWidget(self.message)
            message_layout.addLayout(mes_time_layout)

            message_buble_layout.addLayout(message_layout)
            self.widget.setLayout(message_buble_layout)
    
            if self.me == True:
                self.widget.setStyleSheet(f'''
                            border-top-left-radius: 12px;
                            border-top-right-radius: 12px;
                            border-bottom-left-radius: 12px;
                            border-bottom-right-radius: 0px;
                            color: white;
                            background-color: {MAIN_COLOR};''')
            else:
                self.widget.setStyleSheet(f'''
                            border-top-left-radius: 12px;
                            border-top-right-radius: 12px;
                            border-bottom-left-radius: 0px;
                            border-bottom-right-radius: 12px;
                            color: {TEXT_COLOR};
                            background-color: {NOT_USER_BUBLS};''')

            layout.addWidget(self.widget)
        
        self.setLayout(layout)

    def contextMenuEvent(self, event):
        # Создание контекстного меню
        menu = QMenu(self)

        # Добавление действий в меню
        mute_action = QAction("Удалить сообщение", self)
        copy_action = QAction("Скопировать сообщение", self)
        delete_action = QAction("Ответить", self)
        # clear_action = QAction("Выбрать", self)
        edit_action = QAction("Изменить", self)

        menu.setStyleSheet(f"""
            QMenu {{
                background-color: {MAIN_BOX_COLOR}; /* Фон меню */
                border: 1px solid #4C566A; /* Граница меню */
                color: white; /* Цвет текста */
                font-size: 14px; /* Размер шрифта */
            }}
            QMenu::item {{
                padding: 8px 16px; /* Отступы внутри пунктов меню */
                background-color: transparent; /* Прозрачный фон по умолчанию */
            }}
            QMenu::item:selected {{
                background-color: #4C566A; /* Фон при выделении */
                color: #E5E9F0; /* Цвет текста при выделении */
            }}
            QMenu::item:hover {{
                background-color: #88C0D0; /* Цвет фона при наведении */
                color: #2E3440; /* Цвет текста при наведении */
            }}
        """)

        for action in menu.actions():
            action.setProperty("hover", True)
        menu.setCursor(Qt.PointingHandCursor)

        # Добавляем действия в меню
        menu.addAction(mute_action)
        menu.addAction(delete_action)
        # menu.addAction(clear_action)
        menu.addAction(edit_action)

        # Показываем меню в точке клика
        menu.exec(event.globalPos())

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
