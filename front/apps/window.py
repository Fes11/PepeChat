from PySide6.QtWidgets import QMainWindow, QLabel, QPushButton
from PySide6.QtCore import QRect, Qt, QCoreApplication
from PySide6.QtGui import QCursor
from apps.auth import admin_auth
from main_window import Ui_MainWindow
from loading import Load
from settings import HOST
import requests

class MainWindow():
    '''Основные функции главного окна'''
    
    def open_chat(self):
        '''Открыть чат'''
        print(f'Open chat: "chat"')
    
    def move_window(self):
        pass


class ChatWindow(QMainWindow):
    def __init__(self):
        super(ChatWindow, self).__init__()
        self.ui = Ui_MainWindow()
        self.ui.setupUi(self)
    
    def chat_view_messages(self):
        message = Load.load_chat()[::-1]
        x = 780
        y = 480
        
        for mes in message:
            # Сообщения 
            self.messages = QLabel(self.ui.widget)
            self.messages.setObjectName(u"messages")
            self.messages.setEnabled(True)
            self.messages.setGeometry(QRect(760, y, 120, 40))
            self.messages.setLayoutDirection(Qt.LeftToRight)
            self.messages.setAutoFillBackground(False)
            self.messages.setStyleSheet(u"background-color: rgb(236, 236, 236);\n"
    "padding: 10px;\n"
    "font-size: 14px;\n"
    "border-radius: 15px;")
            self.messages.setAlignment(Qt.AlignRight|Qt.AlignTrailing|Qt.AlignVCenter)
            self.messages.setText(QCoreApplication.translate("MainWindow", u"", None))
            
            # Аватар 
            self.message_avatar = QPushButton(self.ui.widget)
            self.message_avatar.setObjectName(u"message_avatar")
            self.message_avatar.setGeometry(QRect(890, y, 40, 40))
            self.message_avatar.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
            self.message_avatar.setStyleSheet(u"border-image: url(:/background/0q2XvMbngZU.jpg);\n"
    "border-radius: 20px;\n"
    "")
            self.ui.scroll_area.valueChanged.connect(lambda: do_action(self))
 
            def do_action(self):
                y = self.ui.scroll_area.value()
                self.messages.setGeometry(QRect(760, y, 120, 40))
            
            y -= 60
            self.messages.setText(mes['text'])
            
    
            
    def send_message(self):
        '''Отправка сообщений'''
        
        headers = {
            "Authorization": f"Bearer {admin_auth()}",
            "Content-Type": "application/json"
        }
 
        data = {
            "text": "nigger",
            "chat_id": 1,
            "user": 1,
        }
        
        response = requests.post(f'{HOST}/api/v1/chats/messages/', json=data, headers=headers)
        
        if response.status_code == 201:
            print("Message sent successfully!")
        else:
            print("Failed to send message. Error code:", response.text)