from dialog import DialogWindow
from apps.chat.fields import HoverButton, DarkenButton
from apps.chat.user import User
from PySide6.QtGui import QIcon, QCursor, QTransform
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QPushButton, QListWidgetItem)
from .style import MAIN_COLOR, HOVER_MAIN_COLOR, BG_COLOR

class CreateChatDialog(DialogWindow):
    '''Модальное окно создания чата. 
    
       Наследуеться от QPushButton чтобы при нажатии на 
       пустое, затемненное пространство закрывать модальное окно. '''
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        form_layout = QVBoxLayout()
        form_layout.setSpacing(10)
        form_layout.setContentsMargins(20,10,20,20)
        
        top_label_and_close_layout = QHBoxLayout()
        
        main_label = QLabel('Chat create')
        main_label.setStyleSheet('font-size: 15px;')
        top_label_and_close_layout.addWidget(main_label)
        
        close_btn = HoverButton(self, path='static/image/close')
        close_btn.setObjectName('close_btn')
        close_btn.setIcon(QIcon('static/image/close.png'))  # Установите путь к вашему изображению
        close_btn.setStyleSheet('''#close_btn {background: rgba(0,0,0,0);}''')
        close_btn.setIconSize(QSize(25, 25))
        close_btn.setFixedSize(30, 30)
        close_btn.setCursor(QCursor(Qt.PointingHandCursor))
        close_btn.clicked.connect(self.close)
        top_label_and_close_layout.addWidget(close_btn)
        
        form_layout.addLayout(top_label_and_close_layout)
        
        top_layout = QHBoxLayout()
        top_layout.setSpacing(15)
        
        self.image_path = 'static/image/person.png'  # Начальное значение для image_path
        iamge = DarkenButton(100, self.image_path)
        iamge.setCursor(QCursor(Qt.PointingHandCursor))
        iamge.imageSelected.connect(self.update_image_path)
        top_layout.addWidget(iamge)
        
        name_and_people_layout = QVBoxLayout()
        name_and_people_layout.setSpacing(10)
        
        name_chat = QTextEdit()
        name_chat.setFixedHeight(40)
        name_chat.setPlaceholderText("Введите название чата...")
        name_chat.setStyleSheet(f'background-color: {BG_COLOR}')
        name_and_people_layout.addWidget(name_chat)
        
        searc_people = QPushButton(" Добавить участников")
        searc_people.setFixedHeight(40)
        searc_people.setCursor(QCursor(Qt.PointingHandCursor))
        searc_people.setIcon(QIcon('static/image/add.png'))  # Установите путь к вашему изображению
        searc_people.setIconSize(QSize(16, 16))
        searc_people.clicked.connect(self.add_user)
        name_and_people_layout.addWidget(searc_people)
        top_layout.addLayout(name_and_people_layout)
        form_layout.addLayout(top_layout)

        # rules_layout = QHBoxLayout()

        # rules_label = QLabel('Роли')
        # rules_layout.addWidget(rules_label)

        # rules_btn = QPushButton()
        # rules_btn.setObjectName('rules_btn')
        # rules_btn.setIcon(QIcon('static/image/close_hover.png'))  # Установите путь к вашему изображению
        # rules_btn.setStyleSheet('''#rules_btn {background: rgba(255,255,255,0.1); border-radius: 5px;}
        #                            #rules_btn:hover {background: rgba(255,255,255,0.2);}''')
        # rules_btn.setIconSize(QSize(22, 22))
        # self.rotate_icon(rules_btn, 45)
        # rules_btn.setFixedSize(25, 25)
        # rules_btn.setCursor(QCursor(Qt.PointingHandCursor))
        # rules_layout.addWidget(rules_btn)
        # form_layout.addLayout(rules_layout)
        
        people_label = QLabel('Участники: ')
        form_layout.addWidget(people_label)
        
        self.user_list = QListWidget()
        self.user_list.setStyleSheet('background-color: rgba(255,255,255, 0);')
        self.user_list.setSpacing(0)
        self.user_list.setContentsMargins(0,0,0,0)
        form_layout.addWidget(self.user_list)
        
        self.create_btn = QPushButton('Создать')
        self.create_btn.setObjectName('create_btn')
        self.create_btn.setStyleSheet(f'''#create_btn {{background-color: {MAIN_COLOR};}}
                                         #create_btn:hover {{background: {HOVER_MAIN_COLOR};}}''')
        self.create_btn.setFixedHeight(41)
        self.create_btn.setCursor(QCursor(Qt.PointingHandCursor))
        form_layout.addWidget(self.create_btn)
        
        self.main_widget.setLayout(form_layout)
    
    def update_image_path(self, new_path):
        self.image_path = new_path 
    
    def add_user(self):
        self.user_widget = User()
        self.user_widget.setStyleSheet('background-color: rgba(0, 0, 0, 0); border: none;')
        self.user_widget.delit_user_btn.clicked.connect(self.del_user)

        # Создаем пользовательский виджет
        # Создаем пустой элемент QListWidgetItem
        item = QListWidgetItem(self.user_list)
        # Устанавливаем размер элемента на основе размера виджета
        item.setSizeHint(self.user_widget.sizeHint())
        # Привязываем пользовательский виджет к элементу списка
        self.user_list.setItemWidget(item, self.user_widget)

    def del_user(self):
        # Получаем текущий выбранный элемент
        selected_item = self.user_list.currentItem()
        if selected_item:
            # Получаем индекс текущего элемента
            row = self.user_list.row(selected_item)
            # Удаляем элемент по индексу
            self.user_list.takeItem(row)
    
    def rotate_icon(self, widget, angle):
        # Извлекаем изображение из иконки
        pixmap = widget.icon().pixmap(widget.iconSize())
        # Создаем трансформацию для вращения
        transform = QTransform().rotate(angle)
        # Применяем трансформацию к изображению
        rotated_pixmap = pixmap.transformed(transform)
        # Обновляем иконку на кнопке
        rotated_icon = QIcon(rotated_pixmap)
        widget.setIcon(rotated_icon)


class SettingsDialog(DialogWindow):
    '''Модальное окно настроек приложения. '''
    
    def __init__(self, parent=None):
        super().__init__(parent)

        form_layout = QVBoxLayout()
        
        self.label = QLabel('Settings')
        form_layout.addWidget(self.label)


        self.main_widget.setLayout(form_layout)
