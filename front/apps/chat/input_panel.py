from pathlib import Path
from random import randrange
from datetime import datetime
from PySide6 import QtCore
from PySide6.QtGui import QIcon, QCursor, QPixmap
from PySide6.QtCore import Qt, QSize, Signal
from PySide6.QtWidgets import (QApplication, QTextEdit, QScrollArea, QVBoxLayout, QLabel, QListWidget,
                               QHBoxLayout, QWidget, QSizePolicy, QPushButton, QFileDialog)
from apps.chat.emoji import EmojiPicker
from apps.chat.fields import PlainTextEdit, HoverButton
from apps.chat.style import MAIN_COLOR, MAIN_BOX_COLOR, NOT_USER_BUBLS, TEXT_COLOR, HOVER_MAIN_COLOR
from image import get_rounds_edges_image


class InputPanel(QWidget):
    def __init__(self, file_list, messages_list) -> None:
        super().__init__()
        self.file_list = file_list
        self.messages_list = messages_list

        layout = QVBoxLayout()
        layout.setContentsMargins(10,10,10,10)
        layout.setSpacing(10)
        layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        widget = QWidget()
        widget.setStyleSheet(f'''background-color: {MAIN_BOX_COLOR}; 
                                 border-top: 1px solid rgba(255,255,255, 0.1);
                                 border-top-left-radius: 0px;
                                 border-top-right-radius: 0px;
                                 border-bottom-left-radius: 10px;
                                 border-bottom-right-radius: 10px;''')
        
        # Кнопка для отправки сообщения
        self.send_message_btn = QPushButton()
        self.send_message_btn.setMaximumSize(45, 45)
        self.send_message_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_message_btn.setStyleSheet(f'''QPushButton {{background-color: {MAIN_COLOR}; border-radius: 10px; padding: 10px; font-weight: bold;}}
                                                QPushButton:hover {{background-color: {HOVER_MAIN_COLOR};}}''')
        self.send_message_btn.setIcon(QIcon('static/image/send.png'))  # Установите путь к вашему изображению
        self.send_message_btn.setIconSize(QSize(24, 24))
        self.send_message_btn.clicked.connect(self.send_message)

        self.send_message_layout = QVBoxLayout()
        self.send_message_layout.setContentsMargins(0,0,0,0)
        self.send_message_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)
        self.send_message_layout.addWidget(self.send_message_btn)

        # Поле ввода сообщения
        self.message_input = MessageInput(self, self.file_list)
        self.message_input.message_edit.installEventFilter(self)
        self.message_input.message_edit.textChanged.connect(self.message_input.adjustHeight)
        self.message_input.message_edit.textChanged.connect(self.adjustHeight)
        self.setFixedHeight(self.message_input.size().height() + 20)

        self.message_input_layout = QHBoxLayout()
        self.message_input_layout.setContentsMargins(0,0,0,0)
        self.message_input_layout.addWidget(self.message_input)
        self.message_input_layout.addLayout(self.send_message_layout)

        # Панель в которой показываються выбранные изображения
        self.view_file_layout = QHBoxLayout()
        self.view_file_layout.setContentsMargins(0,0,0,0)
        self.view_file_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        
        layout.addLayout(self.view_file_layout)
        layout.addLayout(self.message_input_layout)

        widget.setLayout(layout)
        main_layout = QHBoxLayout()
        main_layout.setContentsMargins(0,0,0,0)
        main_layout.addWidget(widget)
        self.setLayout(main_layout)
    
    def adjustHeight(self):
        if self.file_list.count() > 0:
            self.setFixedHeight(self.message_input.size().height() + 140)
        else:
            self.setFixedHeight(self.message_input.size().height() + 20)

    def send_message(self):
        text = self.message_input.message_edit.toPlainText()

        # Если есть файлы то передаем путь к файлу
        if self.file_list.count() > 0:
            last_item_index = self.file_list.count() - 1
            last_item = self.file_list.item(last_item_index)
            self.messages_list.add_message(text, i=randrange(0, 2), path=last_item.text())

            item = self.view_file_layout.takeAt(0)  # Извлекаем элемент из layout
            widget = item.widget()
            widget.deleteLater()
            self.file_list.clear()

            self.setFixedHeight(65)
            self.message_input.message_edit.clear()
        elif text != '': 
            self.messages_list.add_message(text=text, i=randrange(0, 2))
            self.message_input.message_edit.clear()
    
    def eventFilter(self, obj, event) -> bool:
        if event.type() == QtCore.QEvent.KeyPress and obj is self.message_input.message_edit:
            if event.key() == Qt.Key_Return:
                if event.modifiers() == Qt.ControlModifier:  # Если зажаты Ctrl + Enter
                    self.message_input.message_edit.insertPlainText("\n")
                    scroll_bar = self.message_input.message_edit.verticalScrollBar()
                    scroll_bar.setValue(scroll_bar.maximum())
                    return True  # Сообщаем, что событие обработано
                else:  # Если нажат только Enter, отправляем сообщение
                    self.send_message()
                    return True
        return super().eventFilter(obj, event)


class MessageInput(QWidget):
    def __init__(self, input_panel, file_list) -> None:
        super(MessageInput, self).__init__()
        self.input_panel = input_panel
        self.file_list = file_list

        self.setFixedHeight(45)

        widget = QWidget()
        widget.setStyleSheet('''color: white; border: none;
                                border-radius: 10px; 
                                background-color: rgba(255, 255, 255, 0.1); 
                                font-weight: bold;''')
        
        self.message_edit = PlainTextEdit()
        self.message_edit.setFixedHeight(45)
        self.message_edit.setAlignment(Qt.AlignmentFlag.AlignVCenter)
        self.message_edit.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.message_edit.setContentsMargins(0,0,0,0)
        self.message_edit.installEventFilter(self)
        self.message_edit.setPlaceholderText("Напишите сообщение...")
        self.message_edit.setMinimumWidth(400)
        self.message_edit.setStyleSheet('''background-color: rgba(0, 0, 0, 0); padding: 10px 0px 10px 15px;''')

        self.message_input_layout = QHBoxLayout()
        self.message_input_layout.setContentsMargins(0,0,10,0)
        self.message_input_layout.setSpacing(0)
        
        self.send_file = HoverButton(self, path='static/image/paper-clip')
        self.send_file.setFixedSize(30, 45)
        self.send_file.setCursor(QCursor(Qt.PointingHandCursor))
        self.send_file.setStyleSheet('''background-color: rgba(255, 255, 255, 0);''')
        self.send_file.setIcon(QIcon('static/image/paper-clip.png'))
        self.send_file.setIconSize(QSize(27, 27))
        self.send_file.clicked.connect(self.open_file_dialog)

        self.smile_btn = HoverButton(self, path='static/image/smile')
        self.smile_btn.setFixedSize(30, 45)
        self.smile_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.smile_btn.setStyleSheet('''background-color: rgba(255, 255, 255, 0);''')
        self.smile_btn.setIcon(QIcon('static/image/smile.png'))
        self.smile_btn.setIconSize(QSize(27, 27))
        self.smile_btn.clicked.connect(self.show_emoji_picker)

        self.send_file_layout = QHBoxLayout()
        self.send_file_layout.setSpacing(5)
        self.send_file_layout.setAlignment(Qt.AlignmentFlag.AlignBottom)

        self.send_file_layout.addWidget(self.send_file)
        self.send_file_layout.addWidget(self.smile_btn)
        
        self.message_input_layout.addWidget(self.message_edit)
        self.message_input_layout.addLayout(self.send_file_layout)
        widget.setLayout(self.message_input_layout)
        main_layout = QHBoxLayout()
        main_layout.setContentsMargins(0,0,0,0)
        main_layout.addWidget(widget)
        self.setLayout(main_layout)
        
        self.emoji_picker = EmojiPicker(self, self.message_edit)

    def show_emoji_picker(self):
        # Получаем кнопку
        button = self.sender()

        # Глобальная позиция кнопки
        button_global_pos = button.mapToGlobal(button.rect().topLeft())

        # Сдвиги для точной настройки
        offset_x = -self.emoji_picker.width() + 10 # Влево
        offset_y = -button.height() - 250

        # Вычисляем новую позицию
        pos = button_global_pos
        pos.setX(pos.x() + offset_x)
        pos.setY(pos.y() + offset_y)

        # Перемещаем и показываем окно
        self.emoji_picker.move(pos)
        self.emoji_picker.show()
    
    def open_file_dialog(self):
        dialog = QFileDialog(self)
        dialog.setFileMode(QFileDialog.FileMode.ExistingFiles)
        dialog.setNameFilter("Images (*.png *.jpg *.gif)")
        dialog.setViewMode(QFileDialog.ViewMode.List)
        if dialog.exec():
            filenames = dialog.selectedFiles()
            if filenames:
                self.file_list.addItems([str(Path(filename)) for filename in filenames])
                self.setMaximumHeight(190)

                last_item_index = self.file_list.count() - 1
                last_item = self.file_list.item(last_item_index)
                
                self.view_file = ViewFile(last_item.text())
                self.view_file.file_removed.connect(self.remove_file)
                self.input_panel.view_file_layout.addWidget(self.view_file)
                self.input_panel.setFixedHeight(self.size().height() + 140)
    
    def remove_file(self, filename: str):
        # Удаление из QListWidget
        items = self.file_list.findItems(filename, Qt.MatchFlag.MatchExactly)
        for item in items:
            row = self.file_list.row(item)
            self.file_list.takeItem(row)

        # Удаление виджета ViewFile из layout
        for i in range(self.input_panel.view_file_layout.count()):
            widget = self.input_panel.view_file_layout.itemAt(i).widget()
            if isinstance(widget, ViewFile) and widget.path == filename:
                widget.setParent(None)  # Удаление из интерфейса
                self.input_panel.adjustHeight()
                self.adjustHeight()
                break

    def adjustHeight(self):
        # Подсчёт количества строк текста
        doc = self.message_edit.document().clone()
        doc.setTextWidth(self.message_edit.viewport().width())
        height = doc.size().height()
        height += self.message_edit.frameWidth() * 2

        # Устанавливаем минимальную и максимальную высоту
        min_height = 45  # Минимальная высота (можно изменить)
        max_height = 150  # Максимальная высота (чтобы ограничить рост)
        
        # Ограничиваем высоту, если текст занимает слишком много места
        new_height = max(min_height, min(int(height), max_height))
        self.message_edit.setFixedHeight(new_height)
        self.setFixedHeight(self.message_edit.size().height() - 10)

class ViewFile(QPushButton):
    file_removed = Signal(str)

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
        self.delete_btn.clicked.connect(self.delete_file)

        self.delete_layout = QVBoxLayout()
        self.delete_layout.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignRight)
        self.delete_layout.addWidget(self.delete_btn)

        self.setLayout(self.delete_layout)

    def delete_file(self):
        self.file_removed.emit(self.path)
