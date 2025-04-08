from apps.chat.fields import ImageChanger
from apps.chat.user import User
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QIcon, QCursor, QIcon, QCursor, QPixmap
from PySide6.QtWidgets import (QVBoxLayout,QHBoxLayout, QWidget, QPushButton, QLabel, QTextEdit, QLineEdit, QScrollArea, QGridLayout, QComboBox)
from .style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR, combo_box_style


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

        if chat_model.chat_type != 'group': # и пользователь не админ чата
            self.chat_image = ImageChanger(size=75, path=self.chat_model.avatar_path, rounded=10, active=False, chat_model=self.chat_model)
        else:
            self.chat_image = ImageChanger(size=75, path=self.chat_model.avatar_path, rounded=10, chat_model=self.chat_model)
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

        if chat_model.chat_type == 'group':
            self.description = QTextEdit(self.chat_model.description)
            self.description.setContentsMargins(0,0,0,0)
            self.description.setFixedSize(150, 50)
            self.description.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 13px;')
            description_text_layout.addWidget(self.description)
        else:
            self.user_login = QTextEdit('@user1251326')
            self.user_login.setContentsMargins(0,0,0,0)
            self.user_login.setFixedSize(150, 50)
            self.user_login.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 13px;')
            description_text_layout.addWidget(self.user_login)

        description_layout.addLayout(description_text_layout)

        description_widget.setLayout(description_layout)
        layout.addWidget(description_widget)

        if self.chat_model.chat_type == 'group':
            self.link = Links()
            self.link.setStyleSheet('background-color: rgba(255,255,255, 0.1); border-radius: 20px;')
            layout.addWidget(self.link)

            self.online_label = QLabel(f'Online - {self.chat_model.users}')
            self.online_label.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 12px; padding-left: 2px;')
            layout.addWidget(self.online_label)

            self.user_list = QVBoxLayout()
            self.user_list.setSpacing(0)
            self.user_list.setContentsMargins(0,0,0,0)

            for i in range(0, self.chat_model.users):
                self.user = User()
                self.user_list.addWidget(self.user)

            layout.addLayout(self.user_list)

            self.online_label = QLabel('Offline - 1')
            self.online_label.setStyleSheet('color: rgba(255,255,255, 0.4); font-size: 12px; padding-left: 2px;')
            layout.addWidget(self.online_label)

            self.ofline_user_list = QVBoxLayout()
            self.ofline_user_list.setSpacing(0)
            self.ofline_user_list.setContentsMargins(0,0,0,0)

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


class AttachmentsTabs(QWidget):
    '''Вложения.'''
    def __init__(self) -> None:
        super(AttachmentsTabs, self).__init__()

        # Основной вертикальный лейаут
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)

        # Выпадающий список
        self.combo_box = QComboBox()
        self.combo_box.setFixedSize(70, 30)
        self.combo_box.setCursor(Qt.PointingHandCursor)
        self.combo_box.setStyleSheet(combo_box_style)
        self.combo_box.addItems(["Media", "File", "Links"])
        self.layout.addWidget(self.combo_box)

        # Подключение события изменения выбора
        self.combo_box.currentTextChanged.connect(self.on_selection_change)

        # Область прокрутки
        self.scroll_area = QScrollArea()
        self.scroll_area.setFixedHeight(800)
        self.scroll_area.setWidgetResizable(True)
        self.layout.addWidget(self.scroll_area)

        # Контейнер для содержимого
        self.container = QWidget()
        self.attachment_layout = QGridLayout()
        self.attachment_layout.setContentsMargins(0, 0, 0, 0)
        self.container.setLayout(self.attachment_layout)
        self.scroll_area.setWidget(self.container)

        # Настройки сетки
        self.image_size = 130
        self.max_width = 300
        self.column_count = self.max_width // self.image_size

        self.row = 0
        self.column = 0

        for i in range(0, 15):
            self.add_image('static/image/ava3.jpg')
    
    def on_selection_change(self, text):
        pass

    def add_image(self, image_path):
        # Создаем QLabel для изображения
        pixmap = QPixmap(image_path).scaled(
            self.image_size, self.image_size, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation
        )
        label = QLabel()
        label.setPixmap(pixmap)
        label.setFixedSize(self.image_size, self.image_size)
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Добавляем в сетку
        self.attachment_layout.addWidget(label, self.row, self.column)

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

        text = QLabel('Это настройки чата...')
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
