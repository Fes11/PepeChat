import re
import random
from apps.chat.chat_area import MessagesList
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, TEXT_COLOR, HOVER_MAIN_COLOR
from apps.chat.chats import ChatWidget, ChatModel
from datetime import datetime
from PySide6.QtGui import QIcon, QCursor, QPixmap, QColor, QMouseEvent
from PySide6.QtCore import Qt, QSize, QPropertyAnimation, QEasingCurve, Property
from PySide6.QtWidgets import (QAbstractItemView, QScrollArea, QVBoxLayout, QLabel, QGraphicsDropShadowEffect,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QMenu, QListWidget, QListWidgetItem)
from apps.profile.profile import Profile
from apps.chat.serach import UsernameSearchWidget


class Sidebar(QWidget):
    '''Боковая панель с чатами, поиском и кнопкой добавления чатов.'''

    def __init__(self, main_window, orig_window, parent=None):
        super().__init__(parent)
        self.main_window = main_window
        self.orig_window = orig_window

        self.setMouseTracking(True)  # Включаем отслеживание движения мыши
        self.setMinimumWidth(65)
        self.setMaximumWidth(300)

        self.num = 0

        # Настройки Sidebar
        self.widget = QWidget()
        self.widget.setObjectName('widget')
        self.widget.setStyleSheet(f'''#widget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px; border: none;}}''')
        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)

        # Основной слой
        self.sidebar_layout = QVBoxLayout()
        self.sidebar_layout.setContentsMargins(0, 0, 0, 0)
        self.sidebar_layout.setSpacing(13)

        self.chat_scroll = QScrollArea()
        self.chat_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.chat_scroll.setContentsMargins(0, 0, 0, 0)
        self.chat_scroll.setWidgetResizable(True)
        self.chat_scroll.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.chat_scroll.setStyleSheet('''QWidget {border: none;}''')

        self.chat_list = QListWidget()
        self.chat_list.setSelectionMode(QAbstractItemView.NoSelection)
        self.chat_list.setContentsMargins(0, 0, 0, 0)
        self.chat_list.setSpacing(0)
        self.chat_list.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.chat_list.customContextMenuRequested.connect(self.show_context_menu)

        self.sidebar = QVBoxLayout()
        self.sidebar.setContentsMargins(0,0,0,0)
        self.sidebar.setSpacing(0)
        self.sidebar.addWidget(self.chat_list)

        self.chat_scroll.setLayout(self.sidebar)

        # Поиск
        self.search_layout = QHBoxLayout()
        self.search_layout.setSpacing(0)
        self.search_layout.setContentsMargins(0,0,0,0)

        self.search_widget = QWidget()
        self.search_widget.setMaximumHeight(40)
        self.search_widget.setStyleSheet('''background-color: #3A3A40; color: white; 
                                            border-radius: 16px;''')

        self.seatch_image = QPushButton()
        self.seatch_image.setFixedSize(30, 40)
        self.seatch_image.setStyleSheet('''background-color: rgba(255, 255, 255, 0); padding-left: 10px;''')
        self.seatch_image.setIcon(QIcon('static/image/search_icon.png'))  # Установите путь к вашему изображению
        self.seatch_image.setIconSize(QSize(24, 24))

        self.serch = UsernameSearchWidget()

        self.search_layout.addWidget(self.seatch_image)
        self.search_layout.addWidget(self.serch)
        self.search_widget.setLayout(self.search_layout)

        top_layout = QHBoxLayout()
        top_layout.setSpacing(10)
        top_layout.setContentsMargins(0,0,0,0)

        logo = QLabel(self)
        logo.setStyleSheet(f'background-color: {MAIN_COLOR}; border-radius: 10px;')
        pixmap = QPixmap('static/image/logo.png')
        pixmap.scaled(30, 30)
        logo.setPixmap(pixmap)

        # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)  # радиус размытия
        rgba = list(map(int, re.findall(r'\d+', MAIN_COLOR)))
        color = QColor(rgba[0], rgba[1], rgba[2])
        self.glow.setColor(color)  # цвет свечения
        self.glow.setOffset(0, 0)  # смещение тени
        logo.setGraphicsEffect(self.glow)

        top_layout.addWidget(logo)
        top_layout.addWidget(self.search_widget)

        self.new_chat_btn = QPushButton('  Создать чат')
        self.new_chat_btn.setFixedHeight(35)
        self.new_chat_btn.setIcon(QIcon('static/image/add.png'))  # Установите путь к вашему изображению
        self.new_chat_btn.setIconSize(QSize(16, 16))
        self.new_chat_btn.clicked.connect(self.main_window.open_add_chat)
        self.new_chat_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; color: white;
                                                          font-weight: bold; border:none; font-size: 11px; border-radius: 10px;}}
                                           QPushButton:hover{{background-color: {HOVER_MAIN_COLOR};}}''')
        self.new_chat_btn.setCursor(QCursor(Qt.PointingHandCursor))

        self.new_chat_btn_layout = QVBoxLayout()
        self.new_chat_btn_layout.setSpacing(0)
        self.new_chat_btn_layout.setContentsMargins(10,0,10,10)
        self.new_chat_btn_layout.addWidget(self.new_chat_btn)

        chat_list_lable = QLabel('Chats')
        chat_list_lable.setFixedSize(40,10)
        chat_list_lable.setStyleSheet('''QLabel {color: rgba(255, 255, 255, 0.35); font-size: 12px; font-weight: bold; padding-left: 2px;}''')

        top_sidebar = QVBoxLayout()
        top_sidebar.setContentsMargins(10, 10, 10, 0)

        # Добавляем виджеты
        top_sidebar.addLayout(top_layout)
        top_sidebar.addWidget(chat_list_lable)
        self.sidebar_layout.addLayout(top_sidebar)
        self.sidebar_layout.addWidget(self.chat_scroll)
        self.sidebar_layout.addLayout(self.new_chat_btn_layout)

        self.widget.setLayout(self.sidebar_layout)

        self.mini_profile = Profile()
        self.mini_profile_height = 60
        self.mini_profile_width = 300
        self.open_profile = False
        self.mini_profile.setFixedHeight(self.mini_profile_height)
        self.mini_profile.arrow_btn.clicked.connect(self.open_mini_profile)
        self.mini_profile.user_widget.avatar.clicked.connect(self.open_mini_profile)

        layout.addWidget(self.widget)
        layout.addWidget(self.mini_profile)
        self.setLayout(layout)

        # Определение переменных для отслеживания состояния
        self.resizing = False
        self.resize_margin = 8  # Чувствительная зона для изменения размера

        self.sidebar_hidden = True
    
    def show_context_menu(self, position):
        """Отображает контекстное меню для элемента списка."""
        # Открываем контекстное меню для элемента
        menu = QMenu(self)

        mute_action = menu.addAction("Замутить чат")
        clear_action = menu.addAction("Очистить чат")
        delete_action = menu.addAction("Удалить чат")

    def mousePressEvent(self, event: QMouseEvent):
        if self.is_on_resize_margin(event.position()):
            self.resizing = True
            self.start_pos = event.globalPosition().x()
            self.start_width = self.width()

    def mouseMoveEvent(self, event: QMouseEvent):
        if self.resizing:
            delta = event.globalPosition().x() - self.start_pos
            new_width = self.start_width + delta

            # Устанавливаем максимальную и минимальную ширину
            if new_width < 220:
                self.setMaximumWidth(65)
                self.collapse_sidebar()  # Скрываем элементы при ширине < 250
            elif new_width >= 300:
                self.setMaximumWidth(300)
            else:
                self.setMaximumWidth(int(new_width))
                self.expand_sidebar()  # Показываем элементы при ширине >= 250

            if self.parentWidget():
                self.parentWidget().updateGeometry()
        else:
            if self.is_on_resize_margin(event.position()):
                self.setCursor(Qt.CursorShape.SizeHorCursor)
            else:
                self.setCursor(Qt.CursorShape.ArrowCursor)

    def mouseReleaseEvent(self, event: QMouseEvent):
        self.resizing = False

    def is_on_resize_margin(self, pos):
        # Проверяем, находится ли курсор в зоне чувствительности resize_margin справа
        return self.width() - int(pos.x()) <= self.resize_margin

    def collapse_sidebar(self):
        """Скрываем элементы для компактного вида"""
        self.sidebar_hidden = True
        self.close_mini_profile()
        self.open_profile = False
        self.new_chat_btn.setText('')
        self.search_widget.setVisible(False)
        self.mini_profile.user_widget.username.setVisible(False)
        self.mini_profile.user_widget.user_id.setVisible(False)
        self.mini_profile.send_change_profile.setVisible(False)
        self.mini_profile.arrow_btn.setVisible(False)
        self.mini_profile.settings.setVisible(False)
        self.mini_profile.user_widget.data_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)

    def expand_sidebar(self):
        """Показываем элементы для развернутого вида"""
        self.sidebar_hidden = False
        self.new_chat_btn.setText('  Создать чат')
        self.search_widget.setVisible(True)
        self.mini_profile.user_widget.username.setVisible(True)
        self.mini_profile.user_widget.user_id.setVisible(True)
        self.mini_profile.arrow_btn.setVisible(True)
        self.mini_profile.settings.setVisible(True)
    
    def resizeEvent(self, event):
        if self.size().width() == 220:
            self.setMaximumWidth(65)
            self.collapse_sidebar()
        else:
            self.expand_sidebar()
        super().resizeEvent(event)

    def add_chat(self, image_path):
        self.num += 1
        chat_type = random.choice(['private', 'group'])
        avatar_path = image_path
        description = 'Описание там сям...'
        if chat_type == 'group':
            chat_name = f"Групповой чат {self.num}"
        else:
            chat_name = f"Пользователь {self.num}"
        chat_model = ChatModel(chat_name=chat_name, users=['user1', 'user2'], avatar_path=avatar_path, description=description, chat_type=chat_type)
        self.chat_widget = ChatWidget(self.main_window, self.num, chat_model)

        item = QListWidgetItem()
        item.setSizeHint(self.chat_widget.sizeHint())
        self.chat_list.addItem(item)
        self.chat_list.setItemWidget(item, self.chat_widget)
        self.messages_list = MessagesList(self.main_window, self.orig_window, chat_model)
        
        self.main_window.stack.addWidget(self.messages_list)

        # Добавляем виджет чата в список
        self.main_window.chat_widgets.append(self.chat_widget)
    
    @Property(int)
    def animatedHeight(self):
        return self.mini_profile_height

    @animatedHeight.setter
    def animatedHeight(self, value):
        self.mini_profile_height = value
        self.mini_profile.setFixedHeight(value)
    
    @Property(int)
    def animatedWidth(self):
        return self.mini_profile_width

    @animatedWidth.setter
    def animatedWidth(self, value):
        self.mini_profile_width = value
        self.setMaximumWidth(value)

    @Property(QSize)
    def avatarSize(self):
        return self._avatar_size

    @avatarSize.setter
    def avatarSize(self, value):
        self._avatar_size = value
        self.mini_profile.user_widget.avatar.setFixedSize(value)
        self.mini_profile.user_widget.avatar.setIconSize(value)

    def open_mini_profile(self):
        self.mini_profile.rotate_icon(self.mini_profile.arrow_btn, 180)

        if self.open_profile:
            self.close_mini_profile()
            self.open_profile = False
        else:
            self.open_profile = True
            self.sidebar_hidden = True
            self.mini_profile.user_widget.setVisible(False)
            self.mini_profile.mini_profile.setVisible(True)
            self.mini_profile.logout_btn.setVisible(True)
            self.animate(340, QSize(80, 80))
            self.animate_width(300)       
    
    def close_mini_profile(self):
        self.mini_profile.user_widget.setVisible(True)
        self.mini_profile.mini_profile.setVisible(False)
        self.mini_profile.logout_btn.setVisible(False)
        self.animate(60, QSize(40, 40))

    def animate(self, end_height, end_avatar_size): 
        # Анимация высоты
        self.height_animation = QPropertyAnimation(self, b"animatedHeight")
        self.height_animation.setDuration(300)
        self.height_animation.setStartValue(self.mini_profile.height())
        self.height_animation.setEndValue(end_height)
        self.height_animation.setEasingCurve(QEasingCurve.Type.InOutQuart)

        # Анимация размера аватара
        # self.avatar_animation = QPropertyAnimation(self, b"avatarSize")
        # self.avatar_animation.setDuration(500)
        # self.avatar_animation.setStartValue(self.avatarSize)
        # self.avatar_animation.setEndValue(end_avatar_size)
        # self.avatar_animation.setEasingCurve(QEasingCurve.Type.InOutQuart)

        # Запуск обеих анимаций
        self.height_animation.start()
        # self.avatar_animation.start()

    def animate_width(self, end_width):
        self.width_animation = QPropertyAnimation(self, b"animatedWidth")
        self.width_animation.setDuration(500)
        self.width_animation.setStartValue(self.mini_profile.width())
        self.width_animation.setEndValue(end_width)
        self.width_animation.setEasingCurve(QEasingCurve.Type.InOutQuart)
        self.width_animation.start()
