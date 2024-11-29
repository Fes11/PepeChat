from apps.chat.fields import FirstNewChatButton
from apps.chat.dialog import CreateChatDialog
from apps.chat.fields import DarkenButton
from apps.chat.user import User
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QIcon, QCursor, QIcon, QCursor, QPixmap
from PySide6.QtWidgets import (QVBoxLayout,QHBoxLayout, QWidget, QPushButton, QLabel, QTextEdit, QLineEdit, QScrollArea, QGridLayout)
from image import get_rounds_edges_image
from .style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR


class TabsBar(QWidget):
    def __init__(self, chat_model) -> None:
        super(TabsBar, self).__init__()

        self.chat_model = chat_model

        self.setFixedWidth(300)
        self.setStyleSheet('color: white; font-weight: bold; font-size: 12px;')

        layout = QVBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)

        widget = QWidget()
        widget.setStyleSheet(f'background-color: {MAIN_BOX_COLOR}; border-radius: 10px;')

        self.tabs_layout = QVBoxLayout()
        self.tabs_layout.setContentsMargins(15, 15, 15, 15)

        self.menu_tabs = QHBoxLayout()
        self.menu_tabs.setContentsMargins(0, 0, 0, 15)
        self.tabs_layout.addLayout(self.menu_tabs)

        # Кнопки переключения вкладок
        self.main_tabs_btn = QPushButton('Main')
        self.main_tabs_btn.setFixedSize(60, 30)
        self.main_tabs_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.main_tabs_btn.clicked.connect(lambda: self.open_tab(self.main_tabs, self.main_tabs_btn))
        self.menu_tabs.addWidget(self.main_tabs_btn)

        self.attachments_tabs_btn = QPushButton('Attachments')
        self.attachments_tabs_btn.setFixedSize(90, 30)
        self.attachments_tabs_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.attachments_tabs_btn.clicked.connect(lambda: self.open_tab(self.attachments_tabs, self.attachments_tabs_btn))
        self.menu_tabs.addWidget(self.attachments_tabs_btn)

        self.menu_tabs.addStretch()

        self.settings_tabs_btn = QPushButton()
        self.settings_tabs_btn.setFixedSize(24, 24)
        self.settings_tabs_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.settings_tabs_btn.setIcon(QIcon('static/image/settings.png'))
        self.settings_tabs_btn.setIconSize(QSize(24, 24))
        self.settings_tabs_btn.clicked.connect(lambda: self.open_tab(self.settings_tabs, self.settings_tabs_btn))
        self.menu_tabs.addWidget(self.settings_tabs_btn)

        # Инициализация вкладок
        self.main_tabs = MainTabs(self.chat_model)
        self.attachments_tabs = AttachmentsTabs()
        self.settings_tabs = SettingsTabs()

        # Текущий виджет
        self.current_tab = self.main_tabs
        self.current_button = self.main_tabs_btn  # Текущая активная кнопка
        self.tabs_layout.addWidget(self.current_tab)

        self.update_button_styles()  # Установить стиль кнопок

        self.tabs_layout.addStretch()
        widget.setLayout(self.tabs_layout)

        layout.addWidget(widget)
        self.setLayout(layout)

    def switch_tab(self, new_tab):
        """Смена текущей вкладки."""
        self.tabs_layout.removeWidget(self.current_tab)
        self.current_tab.hide()
        self.current_tab = new_tab
        self.tabs_layout.insertWidget(1, self.current_tab)
        self.current_tab.show()

    def update_button_styles(self):
        """Обновить стиль кнопок, выделяя активную."""
        active_style = f'''QPushButton {{
                              background-color: {MAIN_COLOR}; 
                              border-radius: 10px;
                          }}
                          QPushButton:hover {{
                              background-color: {HOVER_MAIN_COLOR};
                          }}'''

        inactive_style = '''QPushButton {
                              background-color: rgba(0,0,0,0.2); 
                              border-radius: 10px;
                          }
                          QPushButton:hover {
                              background-color: rgba(255,255,255,0.3);
                          }'''

        # Установить стиль для каждой кнопки
        self.main_tabs_btn.setStyleSheet(active_style if self.current_button == self.main_tabs_btn else inactive_style)
        self.attachments_tabs_btn.setStyleSheet(active_style if self.current_button == self.attachments_tabs_btn else inactive_style)
        self.settings_tabs_btn.setStyleSheet(active_style if self.current_button == self.settings_tabs_btn else inactive_style)

    def open_tab(self, tab_widget, tab_button):
        """Открыть вкладку и обновить активную кнопку."""
        self.switch_tab(tab_widget)
        self.current_button = tab_button
        self.update_button_styles()

    def open_main_tabs(self):
        """Открыть главную вкладку."""
        self.switch_tab(self.main_tabs)

    def open_attachments_tabs(self):
        """Открыть вкладку вложений."""
        self.switch_tab(self.attachments_tabs)

    def open_settings_tabs(self):
        """Открыть вкладку настроек."""
        self.switch_tab(self.settings_tabs)

class MainTabs(QWidget):
    '''Основной блок с описанием и участниками. '''
    def __init__(self, chat_model) -> None:
        super(MainTabs, self).__init__()

        self.chat_model = chat_model

        self.setStyleSheet('background-color: rgba(0,0,0,0);')

        description_widget = QWidget()
        description_widget.setFixedHeight(75)

        layout = QVBoxLayout()
        layout.setSpacing(15)
        layout.setContentsMargins(0,0,0,0)
        
        description_layout = QHBoxLayout()
        description_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        description_layout.setSpacing(5)
        description_layout.setContentsMargins(0,0,0,0)

        self.chat_image = DarkenButton(75, self.chat_model.avatar_path, rounded=100)
        self.chat_image.setCursor(QCursor(Qt.PointingHandCursor))
        self.chat_image.setFixedSize(75, 75)
        description_layout.addWidget(self.chat_image)

        description_text_layout = QVBoxLayout()
        description_text_layout.setAlignment(Qt.AlignmentFlag.AlignVCenter)
        description_text_layout.setSpacing(0)
        description_text_layout.setContentsMargins(0,0,0,0)

        self.name_chat = QLabel(self.chat_model.chat_name)
        self.name_chat.setStyleSheet('padding-left: 2px; font-size: 16px;')
        self.name_chat.setFixedHeight(20)
        description_text_layout.addWidget(self.name_chat)

        self.description = QTextEdit(self.chat_model.description)
        self.description.setContentsMargins(0,0,0,0)
        self.description.setFixedSize(150, 50)
        self.description.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 13px;')
        description_text_layout.addWidget(self.description)

        description_layout.addLayout(description_text_layout)

        description_widget.setLayout(description_layout)
        layout.addWidget(description_widget)

        self.link = Links()
        self.link.setStyleSheet('background-color: rgba(255,255,255, 0.1); border-radius: 20px;')
        layout.addWidget(self.link)

        if self.chat_model.chat_type == 'group':
            self.online_label = QLabel('Online - 4')
            self.online_label.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 12px; padding-left: 2px;')
            layout.addWidget(self.online_label)

            self.user_list = QVBoxLayout()
            self.user_list.setSpacing(0)
            self.user_list.setContentsMargins(0,0,0,0)

            for i in range(0,3):
                self.user = User()
                self.user_list.addWidget(self.user)

            layout.addLayout(self.user_list)

            self.online_label = QLabel('Offline - 4')
            self.online_label.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 12px; padding-left: 2px;')
            layout.addWidget(self.online_label)

            self.ofline_user_list = QVBoxLayout()
            self.ofline_user_list.setSpacing(0)
            self.ofline_user_list.setContentsMargins(0,0,0,0)

            for i in range(0,2):
                self.ofline_user = User()
                self.ofline_user.setEnabled(False)
                self.ofline_user_list.addWidget(self.ofline_user)

            layout.addLayout(self.ofline_user_list)
        else:
            self.info_label = QTextEdit('Это информация о пользователе с которым вы переписываетесь...')
            self.info_label.setMaximumWidth(250)
            self.info_label.setStyleSheet('color: rgba(255,255,255, 0.8); font-size: 12px; padding-left: 2px;')
            layout.addWidget(self.info_label)

        layout.addStretch()
        self.setLayout(layout)


class AttachmentsTabs(QScrollArea):
    '''Вложения.'''
    def __init__(self) -> None:
        super(AttachmentsTabs, self).__init__()
        self.setWidgetResizable(True)

        # Основной виджет и его макет
        self.container = QWidget()
        self.setWidget(self.container)
        self.layout = QGridLayout()
        self.layout.setContentsMargins(0,0,0,0)
        self.container.setLayout(self.layout)

        text = QLabel('Это вложения...')
        self.layout.addWidget(text)

        # Настройки сетки
        self.image_size = 130
        self.max_width = 300
        self.column_count = self.max_width // self.image_size

        self.row = 0
        self.column = 0

        for i in range(0, 5):
            self.add_image('static/image/ava3.jpg')

    def add_image(self, image_path):
        # Создаем QLabel для изображения
        pixmap = QPixmap(image_path).scaled(
            self.image_size, self.image_size, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation
        )
        label = QLabel()
        label.setPixmap(get_rounds_edges_image(self, pixmap, 10))
        label.setFixedSize(self.image_size, self.image_size)
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Добавляем в сетку
        self.layout.addWidget(label, self.row, self.column)

        # Обновляем положение
        self.column += 1
        if self.column >= self.column_count:
            self.column = 0
            self.row += 1


class SettingsTabs(QWidget):
    '''Настройки чатов.'''
    def __init__(self) -> None:
        super(SettingsTabs, self).__init__()

        layout = QVBoxLayout()

        text = QLabel('Это настройки...')
        layout.addWidget(text)

        self.setLayout(layout)


class Links(QWidget):
    def __init__(self) -> None:
        super(Links, self).__init__()

        layout = QHBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0,0,0,0)

        self.link = QLineEdit('@sad/dssdgsv/xv')
        self.link.setStyleSheet('padding: 10px; font-size: 12px;')
        self.link.setFixedSize(230, 40)
        layout.addWidget(self.link)

        self.link_btn = QPushButton('Copy link')
        self.link_btn.setFixedSize(100, 40)
        self.link_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.link_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; border-radius: 20px; font-size: 13px;}}
                                        QPushButton:hover {{background-color: {HOVER_MAIN_COLOR};}}''')
        layout.addWidget(self.link_btn)

        self.setLayout(layout)
    
    def copy_link(self) -> None:
        pass
