import sys

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget, QTreeView

from chat import Ui_MainWindow


class ExponseTracer(QMainWindow):
    def __init__(self):
        super(ExponseTracer, self).__init__()
        self.ui = Ui_MainWindow()
        self.ui.setupUi(self)
        
        # Основные встроенные функции
        self.ui.close.clicked.connect(self.close)
        self.ui.roll.clicked.connect(self.showMinimized)
        
        # Кастомные функции
        self.ui.push_messages.clicked.connect(self.send_message)
        self.ui.chat_box.clicked.connect(self.open_chat)

    def send_message(self):
        '''Отправка сообщений'''
        print('Send a message')
    
    def open_chat(self):
        '''Открыть чат'''
        print(f'Open chat: "{str(self.ui.title_chat_left.text)}"')  
        

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = ExponseTracer()
    window.show()
    
    sys.exit(app.exec())