from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)

from apps.chat.fields import PlainTextEdit
from apps.chat.style import send_btn_style, MAIN_BOX_COLOR
from BlurWindow.blurWindow import blur

class MessagesList(QWidget):
    def __init__(self) -> None:
        super(MessagesList, self).__init__()

        self.setContentsMargins(0,0,0,0)
        self.setMinimumWidth(600)
        self.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0); border: none;}''')

        # Для добавления файлов
        self.file_list = QListWidget()

        layout = QVBoxLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(0,0,0,0)

        # Название чата
        top_chat_panel = QWidget()
        top_chat_panel.setMinimumHeight(60)
        top_chat_panel.setStyleSheet(f'''background-color: {MAIN_BOX_COLOR}; border-bottom: 1px solid rgba(255,255,255, 0.1);
                                         border-top-left-radius: 10px;
                                         border-top-right-radius: 10px;
                                         border-bottom-left-radius: 0px;
                                         border-bottom-right-radius: 0px;''')

        top_chat_panel_layout = QHBoxLayout()
        top_chat_panel_layout.setSpacing(10)
        top_chat_panel_layout.setContentsMargins(10,0,0,0)

        iamge_chat = QPushButton()
        iamge_chat.setIcon(QIcon('static/image/person.png'))  # Установите путь к вашему изображению
        iamge_chat.setIconSize(QSize(40, 40))
        iamge_chat.setFixedSize(40,40)
        iamge_chat.setStyleSheet('''background: white; border: none; border-radius: 10px;''')
        top_chat_panel_layout.addWidget(iamge_chat)

        self.top_chat_name = QLabel('Name chat')
        self.top_chat_name.setStyleSheet('''background-color: rgba(0,0,0,0); font-size: 13px; font-weight: bold; color: white; border: none;''')
        top_chat_panel_layout.addWidget(self.top_chat_name)

        top_chat_panel.setLayout(top_chat_panel_layout)
        layout.addWidget(top_chat_panel)
    
        # Поле на котором выводятся сообщения
        self.scroll_area = QScrollArea(self)
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.scroll_area.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR}; border:none;}}''')

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

        self.message_input_layout = QHBoxLayout()
        self.message_input_layout.setContentsMargins(0,0,0,0)
        self.message_input_layout.setSpacing(0)
        
        # Поле ввода сообщения
        self.message_input = PlainTextEdit()
        self.message_input.setFixedHeight(45)
        self.message_input.setAlignment(Qt.AlignmentFlag.AlignVCenter)
        self.message_input.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.message_input.setContentsMargins(0,0,0,0)
        self.message_input.installEventFilter(self)
        self.message_input.setPlaceholderText("Напишите сообщение...")
        self.message_input.textChanged.connect(self.adjustHeight)
        self.message_input.setMinimumWidth(400)
        self.message_input.setStyleSheet('''background-color: rgba(255, 255, 255, 0); padding: 10px 0px 10px 15px;''')

        self.message_input_widget = QWidget()
        self.message_input_widget.setFixedHeight(self.message_input.size().height())
        self.message_input_widget.setStyleSheet('''color: white; border: none;
                                            border-radius: 10px; 
                                            background-color: rgba(255, 255, 255, 0.1); 
                                            font-weight: bold;''')

        self.send_file_layout = QVBoxLayout()
        self.send_file_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        # Кнопка для отправки файлов
        self.send_file = QPushButton()
        self.send_file.setFixedSize(45, 42)
        self.send_file.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_file.setStyleSheet('''QPushButton {background-color: rgba(255, 255, 255, 0);}
                                        QPushButton:hover {background-color: rgba(255, 255, 255, 0.1);}''')
        self.send_file.setIcon(QIcon('static/image/paper-clip.png'))
        self.send_file.setIconSize(QSize(24, 24))
        self.send_file.clicked.connect(self.open_file_dialog)

        self.send_file_layout.addWidget(self.send_file)

        self.message_input_layout.addWidget(self.message_input)
        self.message_input_layout.addLayout(self.send_file_layout)
        self.message_input_widget.setLayout(self.message_input_layout)
        
        
        # Кнопка для отправки сообщения
        send_message_layout = QVBoxLayout()
        send_message_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        self.send_message_btn = QPushButton(self)
        self.send_message_btn.setMaximumSize(45, 45)
        self.send_message_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_message_btn.setStyleSheet('''QPushButton {background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 10px; font-weight: bold;}
                                               QPushButton:hover {background-color: rgba(255, 255, 255, 0.4);}''')
        self.send_message_btn.setIcon(QIcon('static/image/send.png'))  # Установите путь к вашему изображению
        self.send_message_btn.setIconSize(QSize(24, 24))
        self.send_message_btn.clicked.connect(self.send_message)
        send_message_layout.addWidget(self.send_message_btn)

        # Слой панели для ввода
        self.input_layout = QHBoxLayout()
        self.input_layout.setContentsMargins(10,0,10,10)
        self.input_layout.setSpacing(10)
        self.input_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)
        self.input_layout.addWidget(self.message_input_widget)
        # self.input_layout.addWidget(self.send_file)
        self.input_layout.addLayout(send_message_layout)

        # Панель ввода
        self.input_panel = QWidget()
        self.input_panel.setFixedHeight(65)
        self.input_panel.setStyleSheet(f'''background-color: {MAIN_BOX_COLOR}; border-top: 1px solid rgba(255,255,255, 0.1);
                                           border-top-left-radius: 0px;
                                           border-top-right-radius: 0px;
                                           border-bottom-left-radius: 10px;
                                           border-bottom-right-radius: 10px;''')
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

        message = QLabel(text)
        message.setWordWrap(True)
        message.adjustSize()
        message.setTextInteractionFlags(Qt.TextSelectableByMouse)
        message.setMaximumWidth(500)
        message.setStyleSheet('''font-size: 14px; background: rgba(0, 0, 0, 0); color: white; font-weight: medium;''')

        message_bubble = QWidget()
        message_bubble.setStyleSheet('''background: rgba(0, 0, 0, 0);''')
        message_bubble.setContentsMargins(0,0,0,0)

        message_buble_layout = QHBoxLayout()
        message_buble_layout.setSpacing(0)
        message_buble_layout.setContentsMargins(0,0,0,0)
        message_buble_layout.addWidget(message)

        # Метка времени
        mes_time = QLabel(datetime.now().strftime('%H:%M'))
        mes_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.65); background: rgba(0, 0, 0, 0);}')

        mes_time_layout = QVBoxLayout()
        mes_time_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)
        mes_time_layout.addWidget(mes_time)
        message_buble_layout.addLayout(mes_time_layout)

        message_bubble.setLayout(message_buble_layout)
 
        self.message_layout = QHBoxLayout()
        self.text_layout.addLayout(self.message_layout)

        if i % 2:
            message_bubble.setStyleSheet('''
                        border-top-left-radius: 12px;
                        border-top-right-radius: 12px;
                        border-bottom-left-radius: 12px;
                        border-bottom-right-radius: 0px;
                        background: rgba(123, 97, 255, 1);
                        padding: 8px;''')
            self.message_layout.setAlignment(Qt.AlignmentFlag.AlignRight)
            self.message_layout.addWidget(message_bubble)

            avatar_layout.addWidget(me_avatar)
            self.message_layout.addLayout(avatar_layout)
        else:
            message_bubble.setStyleSheet('''
                        border-top-left-radius: 12px;
                        border-top-right-radius: 12px;
                        border-bottom-left-radius: 0px;
                        border-bottom-right-radius: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 8px;''')
            avatar_layout.addWidget(mes_avatar)
            self.message_layout.addLayout(avatar_layout)
            self.message_layout.addWidget(message_bubble)
            self.message_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        
        QtCore.QTimer.singleShot(0, self.scrollToBottom)

    def send_message(self):
        text = self.message_input.toPlainText()
        if text:
            self.add_message(text , randrange(0, 2))
            self.message_input.clear()
    
    def send_image(self, path):
        if self.open_lable.isVisible():
                self.open_lable.setVisible(False)
        image = QPushButton()
        image.setStyleSheet('''background: rgba(123, 97, 255, 1); 
                               padding: 5px 0px 15px 0;
                               border-top-left-radius: 10px;
                               border-top-right-radius: 10px;
                               border-bottom-left-radius: 10px;
                               border-bottom-right-radius: 0px;''')
        image.setIcon(QIcon(path))  # Установите путь к вашему изображению
        image.setIconSize(QSize(300, 300))

        me_avatar = QPushButton()
        me_avatar.setFixedSize(30, 30)
        me_avatar.setStyleSheet('''QPushButton {border-radius: 15px}''')
        me_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        me_avatar.setIcon(QIcon('static/image/ava.png'))
        me_avatar.setIconSize(QSize(30, 30))

        avatar_layout = QVBoxLayout()
        avatar_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        avatar_layout.addWidget(me_avatar)

        image_layout = QHBoxLayout()
        image_layout.setAlignment(Qt.AlignmentFlag.AlignRight)
        image_layout.addWidget(image)

        message_layout = QHBoxLayout()

        message_layout.addLayout(image_layout)
        message_layout.addLayout(avatar_layout)
        
        self.text_layout.addLayout(message_layout)
        
        QtCore.QTimer.singleShot(0, self.scrollToBottom)

    def scrollToBottom(self):
        QApplication.processEvents()
        self.scroll_area.verticalScrollBar().setValue(self.scroll_area.verticalScrollBar().maximum())
    
    def eventFilter(self, obj, event):
        if event.type() == QtCore.QEvent.KeyPress and obj is self.message_input:
            if event.key() == QtCore.Qt.Key_Return and self.message_input.hasFocus():
                if event.modifiers() == QtCore.Qt.ControlModifier:
                    self.message_input.insertPlainText("\n")
                    scroll_bar = self.message_input.verticalScrollBar()
                    scroll_bar.setValue(scroll_bar.maximum())
                else:
                    self.send_message()
                    return True
        return super().eventFilter(obj, event)
    
    def adjustHeight(self):
        # Подсчёт количества строк текста
        doc = self.message_input.document().clone()
        doc.setTextWidth(self.message_input.viewport().width())
        height = doc.size().height()
        height += self.message_input.frameWidth() * 2

        # Устанавливаем минимальную и максимальную высоту
        min_height = 45  # Минимальная высота (можно изменить)
        max_height = 150  # Максимальная высота (чтобы ограничить рост)
        
        # Ограничиваем высоту, если текст занимает слишком много места
        new_height = max(min_height, min(int(height), max_height))
        self.message_input.setFixedHeight(new_height)
        self.input_panel.setFixedHeight(new_height + 11)
        self.message_input_widget.setFixedHeight(self.message_input.size().height() - 10)
    
    def open_file_dialog(self):
        dialog = QFileDialog(self)
        dialog.setFileMode(QFileDialog.FileMode.ExistingFiles)
        dialog.setNameFilter("Images (*.png *.jpg)")
        dialog.setViewMode(QFileDialog.ViewMode.List)
        if dialog.exec():
            filenames = dialog.selectedFiles()
            if filenames:
                self.file_list.addItems([str(Path(filename)) for filename in filenames])
                last_item_index = self.file_list.count() - 1
                if last_item_index >= 0:
                    last_item = self.file_list.item(last_item_index)
                    self.send_image(last_item.text())
