from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)

from apps.chat.fields import WrapLabel
from apps.chat.style import send_btn_style, MAIN_BOX_COLOR
from BlurWindow.blurWindow import blur

class MessagesList(QWidget):
    def __init__(self) -> None:
        super(MessagesList, self).__init__()

        self.setContentsMargins(0,0,0,0)
        self.setMinimumWidth(600)
        self.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0); border: none;}''')

        # Для добавления файлов
        self.file_list = QListWidget(self)

        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)
    
        # Поле на котором выводятся сообщения
        self.scroll_area = QScrollArea(self)
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.scroll_area.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border:none; border-radius: 10px;}}''')

        self.text = QWidget(self)
        self.text.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0);}''')
        self.text_layout = QVBoxLayout()
        self.text_layout.addStretch()

        self.open_lable = QLabel('Здесь пока нет сообщений...')
        self.open_lable.setAlignment(Qt.AlignCenter)
        self.open_lable.setStyleSheet('''QLabel {background-color: rgba(0,0,0,0); color: grey; font-size:14px; margin-bottom: 10px;}''')
        self.text_layout.addWidget(self.open_lable)

        self.scroll_area.setWidget(self.text)

        self.text.setLayout(self.text_layout) 
        
        # Поле ввода сообщения
        self.message_input = QTextEdit()
        self.message_input.setContentsMargins(0,0,0,0)
        self.message_input.installEventFilter(self)
        self.message_input.setPlaceholderText("Напишите сообщение...")
        self.message_input.setMinimumWidth(400)
        self.message_input.setFixedHeight(42)
        self.message_input.setStyleSheet('''QTextEdit {color: white; 
                                            border-radius: 10px; 
                                            padding: 10px 0 0 10px; 
                                            background-color: rgba(255, 255, 255, 0.1); 
                                            font-weight: bold;}''')
        # Кнопка для отправки сообщения
        self.send_message_btn = QPushButton(self)
        self.send_message_btn.setMaximumSize(45, 45)
        self.send_message_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_message_btn.setStyleSheet('''QPushButton {background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 10px; font-weight: bold;}
                                               QPushButton:hover {background-color: rgba(255, 255, 255, 0.4);}''')
        self.send_message_btn.setIcon(QIcon('static/image/send.png'))  # Установите путь к вашему изображению
        self.send_message_btn.setIconSize(QSize(24, 24))
        self.send_message_btn.clicked.connect(self.send_message)

        # Кнопка для отправки файлов
        self.send_file = QPushButton()
        self.send_file.setFixedSize(45, 42)
        self.send_file.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_file.setStyleSheet(send_btn_style)
        self.send_file.setIcon(QIcon('static/image/paper-clip.png'))
        self.send_file.setIconSize(QSize(24, 24))
        self.send_file.clicked.connect(self.open_file_dialog)

        # Слой панели для ввода
        self.input_layout = QHBoxLayout()
        self.input_layout.addWidget(self.send_file)
        self.input_layout.addWidget(self.message_input)
        self.input_layout.addWidget(self.send_message_btn)

        # Панель ввода
        self.input_panel = QWidget()
        self.input_panel.setFixedHeight(60)
        self.input_panel.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border-radius: 10px;}}''')
        self.input_panel.setLayout(self.input_layout)

        # Добавляем в основной layout
        layout.addWidget(self.scroll_area)
        layout.addWidget(self.input_panel)
        self.setLayout(layout)
    
    def add_message(self, text, i):
        if self.open_lable.isVisible():
                self.open_lable.setVisible(False)
        mes_avatar = QPushButton()
        mes_avatar.setFixedSize(30, 30)
        mes_avatar.setStyleSheet('''QPushButton {background-color: white; border-radius: 15px}''')
        mes_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        mes_avatar.setIcon(QIcon('static/image/person.png'))
        mes_avatar.setIconSize(QSize(20, 20))
        
        me_avatar = QPushButton()
        me_avatar.setFixedSize(30, 30)
        me_avatar.setStyleSheet('''QPushButton {border-radius: 15px}''')
        me_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        me_avatar.setIcon(QIcon('static/image/ava.png'))
        me_avatar.setIconSize(QSize(30, 30))

        avatar_layout = QVBoxLayout()
        avatar_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        message = WrapLabel(text)
        message.setStyleSheet('''WrapLabel {font-size: 14px; background: rgba(0, 0, 0, 0); color: white;}''')

        message_bubble = QWidget()
        message_bubble.setStyleSheet('''QWidget {background: rgba(0, 0, 0, 0);}''')
        message_bubble.setContentsMargins(0,0,0,0)

        message_buble_layout = QHBoxLayout()
        message_buble_layout.setSpacing(0)
        message_buble_layout.setContentsMargins(0,0,0,0)
        message_buble_layout.addWidget(message)

        # Метка времени
        mes_time = QLabel(datetime.now().strftime('%H:%M'))
        mes_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.65); background: rgba(0, 0, 0, 0); font-weight: bold;}')

        mes_time_layout = QVBoxLayout()
        mes_time_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)
        mes_time_layout.addWidget(mes_time)
        message_buble_layout.addLayout(mes_time_layout)

        message_bubble.setLayout(message_buble_layout)
 
        self.message_layout = QHBoxLayout()
        self.text_layout.addLayout(self.message_layout)

        if i % 2:
            message_bubble.setStyleSheet('''
                    QWidget {
                        border-top-left-radius: 8px;
                        border-top-right-radius: 8px;
                        border-bottom-left-radius: 8px;
                        border-bottom-right-radius: 0px;
                        background: rgba(123, 97, 255, 1);
                        padding: 10px;
                    }
                ''')
            self.message_layout.addStretch()
            self.message_layout.addWidget(message_bubble)

            avatar_layout.addWidget(me_avatar)
            self.message_layout.addLayout(avatar_layout)
        else:
            message_bubble.setStyleSheet('''
                    QWidget {
                        border-top-left-radius: 8px;
                        border-top-right-radius: 8px;
                        border-bottom-left-radius: 0px;
                        border-bottom-right-radius: 8px;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 10px;
                    }
                ''')
            avatar_layout.addWidget(mes_avatar)
            self.message_layout.addLayout(avatar_layout)
            self.message_layout.addWidget(message_bubble)
            self.message_layout.addStretch()
        
        QtCore.QTimer.singleShot(0, self.scrollToBottom)

    def send_message(self):
        text = self.message_input.toPlainText()
        if text:
            self.add_message(text , randrange(0, 2))
            self.message_input.clear()

    def scrollToBottom(self):
        QApplication.processEvents()
        self.scroll_area.verticalScrollBar().setValue(self.scroll_area.verticalScrollBar().maximum())
    
    def eventFilter(self, obj, event):
        if event.type() == QtCore.QEvent.KeyPress and obj is self.message_input:
            if event.key() == QtCore.Qt.Key_Return and self.message_input.hasFocus():
                self.send_message()
        return super().eventFilter(obj, event)
    
    def open_file_dialog(self):
        dialog = QFileDialog(self)
        dialog.setFileMode(QFileDialog.FileMode.ExistingFiles)
        dialog.setNameFilter("Images (*.png *.jpg)")
        dialog.setViewMode(QFileDialog.ViewMode.List)
        if dialog.exec():
            filenames = dialog.selectedFiles()
            if filenames:
                self.file_list.addItems([str(Path(filename)) for filename in filenames])
