from dialog import DialogWindow
from apps.chat.fields import HoverButton, ImageChanger
from apps.chat.user import User
from PySide6.QtGui import QIcon, QCursor, QTransform
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QTextEdit, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QPushButton, QListWidgetItem)
from .style import MAIN_COLOR, HOVER_MAIN_COLOR, BG_COLOR, MAIN_COLOR_NOT_ACTIVE

class CreateChatDialog(DialogWindow):
    '''Модальное окно создания чата. 
    
       Наследуеться от QPushButton чтобы при нажатии на 
       пустое, затемненное пространство закрывать модальное окно. '''
    
    def __init__(self, parent=None):
        super().__init__(parent)

        self.user = 0
        self.chat_name = ""
        
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
        
        self.image = ImageChanger(size=75, active=True)
        self.image.setCursor(QCursor(Qt.PointingHandCursor))
        top_layout.addWidget(self.image)
        
        name_and_people_layout = QVBoxLayout()
        name_and_people_layout.setSpacing(10)
        
        self.edit_chat_name = QTextEdit()
        self.edit_chat_name.setFixedHeight(40)
        self.edit_chat_name.setPlaceholderText("Введите название чата...")
        self.edit_chat_name.setStyleSheet(f'background-color: {BG_COLOR}')
        self.edit_chat_name.textChanged.connect(self.update_chat_name)
        name_and_people_layout.addWidget(self.edit_chat_name)
        
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
        self.user_list.setStyleSheet('''
            QListWidget {
                background-color: rgba(255, 255, 255, 0);
                outline: 0;
            }
            QListWidget::item {
                border: none;
            }
            QListWidget::item:hover {
                background-color: transparent;
            }
            QListWidget::item:selected {
                background-color: transparent;
                color: black;
            }''')
        self.user_list.setSpacing(0)
        self.user_list.setContentsMargins(0,0,0,0)
        form_layout.addWidget(self.user_list)
        
        self.create_btn = QPushButton('Создать')
        self.create_btn.setEnabled(False) 
        self.create_btn.setObjectName('create_btn')
        self.create_btn.setStyleSheet(f'''#create_btn {{background-color: {MAIN_COLOR_NOT_ACTIVE};}}''')
        self.create_btn.setFixedHeight(41)
        self.create_btn.setCursor(QCursor(Qt.PointingHandCursor))
        form_layout.addWidget(self.create_btn)
        
        self.main_widget.setLayout(form_layout)
    
    def update_chat_name(self):
        """Обновляет переменную self.chat_name и проверяет, можно ли активировать кнопку."""
        self.chat_name = self.edit_chat_name.toPlainText().strip()  # Сохраняем текст без лишних пробелов
    
    def add_user(self):
        self.user += 1
        if self.user > 0:
            self.create_btn.setEnabled(True) 
            self.create_btn.setStyleSheet(f'''#create_btn {{background-color: {MAIN_COLOR};}}''')
        else:
            self.create_btn.setEnabled(False) 
            self.create_btn.setStyleSheet(f'''#create_btn {{background-color: {MAIN_COLOR_NOT_ACTIVE};}}
                                              #create_btn:hover {{background: {HOVER_MAIN_COLOR};}}''') 

        # Создаем новый виджет пользователя
        user_widget = User()
        user_widget.setStyleSheet('background-color: rgba(0, 0, 0, 0); border: none;')
        
        # Передаем виджет пользователя в метод del_user через лямбда-функцию
        user_widget.delit_user_btn.clicked.connect(lambda: self.del_user(user_widget))

        # Создаем пустой элемент QListWidgetItem
        item = QListWidgetItem(self.user_list)
        # Устанавливаем размер элемента на основе размера виджета
        item.setSizeHint(user_widget.sizeHint())
        # Привязываем пользовательский виджет к элементу списка
        self.user_list.setItemWidget(item, user_widget)

    def del_user(self, user_widget):
        self.user -= 1
        if self.user > 0:
            self.create_btn.setEnabled(True) 
            self.create_btn.setStyleSheet(f'''#create_btn {{background-color: {MAIN_COLOR};}}''')
        else:
            self.create_btn.setEnabled(False) 
            self.create_btn.setStyleSheet(f'''#create_btn {{background-color: {MAIN_COLOR_NOT_ACTIVE};}}
                                              #create_btn:hover {{background: {HOVER_MAIN_COLOR};}}''')
        # Проходим по всем элементам списка
        for i in range(self.user_list.count()):
            item = self.user_list.item(i)
            # Получаем виджет, связанный с текущим элементом
            widget = self.user_list.itemWidget(item)
            # Если виджет совпадает с переданным, удаляем элемент
            if widget == user_widget:
                self.user_list.takeItem(i)
                break
    
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
