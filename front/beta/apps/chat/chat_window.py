"""
    Window главный класс всех окон
    MainWindow Singleton
    Анимации в отдельном файле
    Messages сделать фабрикой?
    Chat тоже фабрика?
    Задача для gpt: разбей этот код на отдельные файлы по всем правилам ООП и используя паттерны проектирования
"""

from apps.chat.chat import ChatList
from apps.chat.messages import MessagesList
from apps.chat.style import MAIN_BOX_COLOR
from window import Window


class MainWindow(Window):
    '''Основное окно чата.

       Просто добавлем виджеты в main_layout
    '''
    def __init__(self) -> None:
        super(MainWindow, self).__init__()

        # Добавляем виджеты в окно
        self.chat_list = ChatList()
        self.main_layout.addWidget(self.chat_list)

        self.messages_list = MessagesList()
        self.main_layout.addWidget(self.messages_list)

    