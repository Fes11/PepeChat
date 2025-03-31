import re
from datetime import datetime
from PySide6.QtGui import QIcon, QPixmap, QMovie, QCursor, QAction, QFontMetrics
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QVBoxLayout, QLabel, QHBoxLayout, QWidget, QPushButton, QMenu, QSizePolicy)
from apps.chat.style import NOT_USER_BUBLS, TEXT_COLOR, MAIN_COLOR, MAIN_BOX_COLOR, context_menu_style
from apps.profile.profile import Avatar
from utils.media_view import MediaView
from image import get_rounds_edges_image, get_top_rounded_image


class Message(QHBoxLayout):
    '''Объединяет все в полную строку сообщения с баблом и аватаром.'''

    def __init__(self, text, i, path='') -> None:
        super(Message, self).__init__()
        self.text = text
        self.path = path
        self.index = i

        self.max_width = 480

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

        self.formatted_text = self.format_links(text)

        self.message = QLabel(text)
        self.message.setContextMenuPolicy(Qt.NoContextMenu)
        self.message.setWordWrap(True)
        self.message.adjustSize()
        self.message.setOpenExternalLinks(True)
        self.message.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse | Qt.TextInteractionFlag.TextBrowserInteraction)
        self.message.setMaximumWidth(self.max_width)
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
        
        self._adjust_label_size()
        
    def _adjust_label_size(self):
        """Пересчитывает размер QLabel с учетом длины текста."""
        font_metrics = QFontMetrics(self.message.font())
        text = self.message.text()
        
        # Разбиваем текст с учетом максимальной ширины (перенос строк)
        text_size = font_metrics.boundingRect(0, 0, self.max_width, 0, Qt.TextFlag.TextWordWrap, text)

        # Устанавливаем ширину QLabel на основе ширины текста, но не больше max_width
        self.message.setFixedWidth(min(text_size.width(), self.message.maximumWidth()))
        self.message.setText(self.formatted_text)
    
    @staticmethod
    def format_links(text):
        # Регулярное выражение для поиска ссылок
        url_pattern = re.compile(r'(https?://[^\s]+)')
        # Заменяем найденные ссылки на кликабельные
        return url_pattern.sub(r'<a style="color:white;padding:0;margin:0;" href="\1">\1</a>', text)

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
                
            self.message_bubble.emoji_in_text()

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

        self.message_layout = QHBoxLayout()
        self.message_layout.setSpacing(10)
        self.message_layout.setContentsMargins(10,7,10,7)

        message_buble_layout = QVBoxLayout()
        message_buble_layout.setSpacing(0)
        message_buble_layout.setContentsMargins(0,0,0,0)

        # Метка времени
        mes_time = QLabel(datetime.now().strftime('%H:%M'))
        mes_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.65); background: rgba(0, 0, 0, 0); font-size: 12px; font-weight: bold;}')

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
                text = self.message.text()

                image_bubbl = ImageBubble(mes_time, self.path, text)
                image_bubbl.clicked.connect(self.open_media_view)
                original_pixmap = QPixmap(path)
                image_bubbl_size = image_bubbl.calculate_target_size(original_pixmap)
                message_buble_layout.addWidget(image_bubbl)

                self.widget.setStyleSheet(f'''background-color: rgba(0,0,0,0)''')


                if text:
                    self.message.setWordWrap(True)
                    self.message.setMaximumWidth(image_bubbl_size.width() - 68)
                    self.message_layout.addWidget(self.message)
                    self.message_layout.addLayout(mes_time_layout)
                    message_buble_layout.addLayout(self.message_layout)
                    
                    self.widget.setStyleSheet(f'''border-top-left-radius: 12px;
                                                  border-top-right-radius: 12px;
                                                  border-bottom-left-radius: {'12px' if me else 0};
                                                  border-bottom-right-radius: {'12px' if not me else 0};
                                                  color: {TEXT_COLOR};
                                                  background-color: {MAIN_COLOR if me else NOT_USER_BUBLS};''')
                    
                self.widget.setLayout(message_buble_layout)
                layout.addWidget(self.widget)

        else:            
            self.message_layout.addWidget(self.message)
            self.message_layout.addLayout(mes_time_layout)

            message_buble_layout.addLayout(self.message_layout)
            self.widget.setLayout(message_buble_layout)
    
            self.widget.setStyleSheet(f'''border-top-left-radius: 12px;
                                          border-top-right-radius: 12px;
                                          border-bottom-left-radius: {'12px' if me else 0};
                                          border-bottom-right-radius: {'12px' if not me else 0};
                                          color: {TEXT_COLOR};
                                          background-color: {MAIN_COLOR if me else NOT_USER_BUBLS};''')

            layout.addWidget(self.widget)
        
        self.setLayout(layout)

        self.emoji_in_text()

    def contextMenuEvent(self, event):
        # Создание контекстного меню
        menu = QMenu(self)

        # Добавление действий в меню
        mute_action = QAction("Удалить сообщение", self)
        copy_action = QAction("Скопировать сообщение", self)
        delete_action = QAction("Ответить", self)
        # clear_action = QAction("Выбрать", self)
        edit_action = QAction("Изменить", self)

        menu.setStyleSheet(context_menu_style)

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
    
    def emoji_in_text(self):
        with open("static/emoji.txt", "r", encoding="utf-8") as file:
            emojis = file.read().split(',')
        message = self.message.text().strip()
        
        if message in emojis:
            self.message.setStyleSheet('font-size: 120px; background: rgba(0, 0, 0, 0);')
            self.widget.setStyleSheet(f'''background-color: rgba(0,0,0,0);''')
            self.widget.setFixedSize(160,160)
            self.message_layout.setSpacing(0)
            self.message_layout.setContentsMargins(0,0,10,5)


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
    def __init__(self, time, path, text='') -> None:
        super(ImageBubble, self).__init__()
        self.time = time
        self.path = path
        self.text = text

        self.setCursor(QCursor(Qt.PointingHandCursor))
        self.setStyleSheet('background-color: rgba(0, 0, 0, 0)')
        original_pixmap = QPixmap(path)

        # Получаем точные размеры с учетом ограничений
        target_size = self.calculate_target_size(original_pixmap)
        
        # Масштабируем изображение (может увеличивать маленькие изображения)

        # Устанавливаем размер иконки по размеру масштабированного изображения
        self.setIconSize(target_size)
        self.setMaximumHeight(target_size.height())
        self.setMaximumWidth(target_size.width())

        if self.text:
            self.setIcon(QIcon(get_top_rounded_image(original_pixmap, radius=20)))
        else:
            self.setIcon(QIcon(get_rounds_edges_image(self, original_pixmap, rounded=20)))
            time = QLabel(self.time.text())
            time.setFixedSize(50, 22)
            time.setStyleSheet('background-color: rgba(0,0,0,0.5); color: white; padding: 5px; border-radius: 10px; font-size: 12px; font-weight: bold;')
            time.move(target_size.width() - 60, target_size.height() - 30)
            time.setParent(self)


    def calculate_target_size(self, pixmap):
        """Вычисляет целевой размер изображения с учетом минимальных/максимальных ограничений"""
        original_size = pixmap.size()
        max_size = QSize(400, 500)
        min_size = QSize(200, 200)  # Минимальный размер для маленьких изображений
        
        # Если изображение меньше минимального - увеличиваем до минимального
        if original_size.width() < min_size.width() or original_size.height() < min_size.height():
            ratio = max(
                min_size.width() / original_size.width(),
                min_size.height() / original_size.height()
            )
            return QSize(
                int(original_size.width() * ratio),
                int(original_size.height() * ratio)
            )
        
        # Если изображение больше максимального - уменьшаем
        if original_size.width() > max_size.width() or original_size.height() > max_size.height():
            ratio = min(
                max_size.width() / original_size.width(),
                max_size.height() / original_size.height()
            )
            return QSize(
                int(original_size.width() * ratio),
                int(original_size.height() * ratio)
            )
        
        # Если изображение в допустимых пределах - оставляем как есть
        return original_size


class TextBubble(QPushButton):
    def __init__(self) -> None:
        super(TextBubble, self).__init__()
        pass
