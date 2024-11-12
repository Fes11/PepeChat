from apps.chat.fields import FirstNewChatButton
from apps.chat.chat_list import Sidebar
from apps.chat.dialog import CreateChatDialog
from apps.chat.tabs import TabsBar
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (QVBoxLayout,QHBoxLayout, QWidget, QStackedWidget)
from .style import MAIN_COLOR, HOVER_MAIN_COLOR


class ChatScreen(QWidget):
    '''Основное окно чата.'''
    def __init__(self) -> None:
        super(ChatScreen, self).__init__()

        layout = QHBoxLayout()
        layout.setContentsMargins(0,0,0,0)
        
        self.current_chat_index = None  # Хранит индекс текущего чата
        self.chat_widgets = []  # Список виджетов чатов

        # Добавляем виджеты в окно
        self.sidebar = Sidebar(self)

        # self.stack.messages_list.tabs_bar_btn.clicked.connect(self.open_tabs_bar)
        layout.addWidget(self.sidebar)

        self.stack = QStackedWidget(self)
        layout.addWidget(self.stack)

        self.first_chat_btn = FirstNewChatButton('+ Начать чат')
        self.first_chat_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; border: none; color: white; 
                                              font-weight: bold; border-radius: 10px;}} 
                                              QPushButton:hover{{background-color: {HOVER_MAIN_COLOR}}}''')
        self.first_chat_btn.clicked.connect(self.open_add_chat) 

        self.first_chat_layout = QVBoxLayout()
        self.first_chat_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.first_chat_layout.addWidget(self.first_chat_btn)
        self.first_chat = QWidget()
        self.first_chat.setLayout(self.first_chat_layout)
        self.stack.addWidget(self.first_chat)

        self.tabs = TabsBar()
        layout.addWidget(self.tabs)

        self.box = CreateChatDialog(self)
        self.box.create_btn.clicked.connect(self.sidebar.add_chat)
        self.box.create_btn.clicked.connect(lambda: self.switch_chat(self.sidebar.num - 1))
        self.box.create_btn.clicked.connect(self.box.close)
        self.setLayout(layout)
    
    def open_tabs_bar(self):
        print('Тут')
        if self.tabs.isVisible():
            self.tabs.setVisible(False)
            print('Выключено')
        else:
            self.tabs.setVisible(True)
            print('Включено')
    
    def open_add_chat(self):
        self.box.setVisible(True)
        self.box.raise_()
        
    def resizeEvent(self, event):
        self.box.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)

    def switch_chat(self, index):
        # Сброс цвета фона предыдущего активного чата
        if self.current_chat_index is not None:
            prev_chat_widget = self.chat_widgets[self.current_chat_index]
            prev_chat_widget.chat_widget.setStyleSheet(
                '''QPushButton {border: none; background-color: none;} 
                   QPushButton:hover {background-color: rgba(0,0,0, 0.2);}''')

        # Установка цвета фона для текущего активного чата
        current_chat_widget = self.chat_widgets[index]
        current_chat_widget.chat_widget.setStyleSheet(
            f'''QPushButton {{border-left: 5px solid {MAIN_COLOR}; border-radius: 0px; background-color: rgba(255, 255, 255, 0.1);}}
               QPushButton:hover {{background-color: rgba(0,0,0, 0.2); border-radius: 0px;}}''')

        self.stack.setCurrentIndex(index + 1)
        self.current_chat_index = index
