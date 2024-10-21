from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor, QPixmap
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)

from apps.chat.fields import PlainTextEdit,HoverButton
from apps.chat.style import MAIN_COLOR, MAIN_BOX_COLOR, NOT_USER_BUBLS, TEXT_COLOR, HOVER_MAIN_COLOR
from apps.chat.messages import Message
from image import get_rounds_edges_image

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

        # Верхняя панель чата
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
        original_pixmap = QPixmap('static/image/person.png')
        iamge_chat.setIcon(QIcon(get_rounds_edges_image(self, original_pixmap)))  # Установите путь к вашему изображению
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

        self.chat_area = QWidget(self)
        self.chat_area.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0);}''')

        self.chat_area_layout = QVBoxLayout()
        self.chat_area_layout.addStretch()

        self.open_lable = QLabel('Здесь пока нет сообщений...')
        self.open_lable.setAlignment(Qt.AlignCenter)
        self.open_lable.setStyleSheet('''QLabel {background-color: rgba(0,0,0,0); color: grey; font-size:14px; margin-bottom: 10px;}''')
        self.chat_area_layout.addWidget(self.open_lable)

        self.scroll_area.setWidget(self.chat_area)

        self.chat_area.setLayout(self.chat_area_layout)
        
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
        self.message_input.setStyleSheet('''background-color: rgba(0, 0, 0, 0); padding: 10px 0px 10px 15px;''')

        self.message_input_layout = QHBoxLayout()
        self.message_input_layout.setContentsMargins(0,0,0,0)
        self.message_input_layout.setSpacing(0)

        self.message_input_widget = QWidget()
        self.message_input_widget.setFixedHeight(self.message_input.size().height())
        self.message_input_widget.setStyleSheet('''color: white; border: none;
                                                   border-radius: 10px; 
                                                   background-color: rgba(0, 0, 0, 0.1); 
                                                   font-weight: bold;''')
        
        self.send_file = HoverButton(self, path='static/image/paper-clip')
        self.send_file.setFixedSize(45, 42)
        self.send_file.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_file.setStyleSheet('''background-color: rgba(255, 255, 255, 0);''')
        self.send_file.setIcon(QIcon('static/image/paper-clip.png'))
        self.send_file.setIconSize(QSize(27, 27))
        self.send_file.clicked.connect(self.open_file_dialog)

        self.send_file_layout = QVBoxLayout()
        self.send_file_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

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
        self.send_message_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; border-radius: 10px; padding: 10px; font-weight: bold;}}
                                                QPushButton:hover {{background-color: {HOVER_MAIN_COLOR};}}''')
        self.send_message_btn.setIcon(QIcon('static/image/send.png'))  # Установите путь к вашему изображению
        self.send_message_btn.setIconSize(QSize(24, 24))
        self.send_message_btn.clicked.connect(self.send_message)
        send_message_layout.addWidget(self.send_message_btn)

        # Слой панели для ввода
        self.input_layout = QVBoxLayout()
        self.input_layout.setContentsMargins(10,10,10,10)
        self.input_layout.setSpacing(10)
        self.input_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        self.input_messages_layout = QHBoxLayout()
        self.input_messages_layout.addWidget(self.message_input_widget)
        self.input_messages_layout.addLayout(send_message_layout)

        self.view_file_layout = QHBoxLayout()
        self.view_file_layout.setContentsMargins(0,0,0,0)
        self.view_file_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        
        self.input_layout.addLayout(self.view_file_layout)
        self.input_layout.addLayout(self.input_messages_layout)

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
    
    def add_message(self, text, i, path=''):
        if self.open_lable.isVisible():
                self.open_lable.setVisible(False)

        message = Message(text, i, path)
        self.chat_area_layout.addLayout(message)
        
        QtCore.QTimer.singleShot(0, self.scrollToBottom)

    def send_message(self):
        text = self.message_input.toPlainText()

        # Если есть файлы то передаем путь к файлу
        if self.file_list.count() > 0:
            last_item_index = self.file_list.count() - 1
            last_item = self.file_list.item(last_item_index)
            self.add_message(text, randrange(0, 2), path=last_item.text())
                                
            self.view_file_layout.removeWidget(self.view_file)
            self.view_file.setParent(None)
            self.file_list.clear()

            self.input_panel.setFixedHeight(65)
            self.message_input.clear()
        else: 
            self.add_message(text , randrange(0, 2))
            self.message_input.clear()


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
                self.input_panel.setMaximumHeight(190)

                last_item_index = self.file_list.count() - 1
                last_item = self.file_list.item(last_item_index)
                
                self.view_file = ViewFile(last_item.text())
                self.view_file_layout.addWidget(self.view_file)


class InputPanel():
    def __init__(self) -> None:
        super(InputPanel, self).__init__()


class ViewFile(QPushButton):
    def __init__(self, path) -> None:
        super(ViewFile, self).__init__()
        self.path = path

        self.setFixedSize(90, 115)
        self.setStyleSheet('''QPushButton {background-color: rgba(255,255,255, 0.1); border-radius: 10px}
                              QPushButton:hover {background-color: rgba(255,255,255, 0.3);}''')
        self.setCursor(QCursor(Qt.PointingHandCursor))
        self.original_pixmap = QPixmap(path)
        self.setIcon(QIcon(get_rounds_edges_image(self, self.original_pixmap)))
        self.setIconSize(QSize(80, 100))

        self.delete_btn = QPushButton()
        self.delete_btn.setFixedSize(20,20)
        self.delete_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.delete_btn.setIcon(QIcon('static/image/close.png'))
        self.delete_btn.setIconSize(QSize(15, 15))

        self.delete_layout = QVBoxLayout()
        self.delete_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.delete_layout.addWidget(self.delete_btn)

        self.setLayout(self.delete_layout)
