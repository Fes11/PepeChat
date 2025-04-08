import re
from apps.chat.style import MAIN_BOX_COLOR, MAIN_COLOR, HOVER_MAIN_COLOR, TEXT_COLOR, context_menu_style
from apps.chat.models import ChatModel
from PySide6.QtGui import QCursor, QPixmap, QColor, QFont, QPen, QPalette
from PySide6.QtCore import Qt, QSize, QRect, QEvent
from PySide6.QtWidgets import (QVBoxLayout, QLabel, QGraphicsDropShadowEffect, QStyle, QMessageBox,
                               QHBoxLayout, QWidget, QPushButton, QMenu, QStyledItemDelegate,)
from datetime import datetime
from apps.chat.fields import ImageChanger
from image import get_rounded_image, get_rounds_edges_image


class ChatDelegate(QStyledItemDelegate):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.MAIN_COLOR = QColor('#e33b3b')
        self.TEXT_COLOR = QColor("#ffffff")  # замените на нужное значение
        self.ONLINE_COLOR = self.MAIN_COLOR  # Цвет индикатора онлайна
        self.ITEM_HEIGHT = 60
        self.AVATAR_SIZE = 45
        self.MARGIN = 6
        # AVATAR_OFFSET резервирует отступ для вертикальной полосы (4 пикселя)
        self.AVATAR_OFFSET = self.MARGIN + 4

    def paint(self, painter, option, index):
        # Получаем данные чата из модели.
        chat = index.data(Qt.ItemDataRole.UserRole)
        # Флаг выбранности основывается на состоянии элемента.
        is_selected = (option.state & QStyle.State_Selected)
        
        painter.save()

        # Определяем цвет фона элемента.
        if is_selected:
            bg_color = QColor('#4a4a4a')
            painter.fillRect(option.rect, bg_color)
        elif option.state & QStyle.State_MouseOver:
            bg_color = QColor('#3b3b3b')
            painter.fillRect(option.rect, bg_color)
        else:
            # Можно взять цвет из палитры, если фон не задаётся явно.
            bg_color = option.palette.color(QPalette.Window)
            painter.fillRect(option.rect, bg_color)

        # Если элемент выбран, рисуем выделяющую вертикальную полоску слева.
        if is_selected:
            selection_rect = QRect(
                option.rect.left(),
                option.rect.top(),
                4,  # Толщина полосы
                option.rect.height()
            )
            painter.fillRect(selection_rect, self.MAIN_COLOR)

        # Фиксированное положение аватарки: всегда с одинаковым отступом.
        avatar_left = option.rect.left() + self.AVATAR_OFFSET
        avatar_rect = QRect(
            avatar_left,
            option.rect.top() + (self.ITEM_HEIGHT - self.AVATAR_SIZE) // 2,
            self.AVATAR_SIZE,
            self.AVATAR_SIZE
        )
        
        # Загружаем исходное изображение аватара.
        pixmap = QPixmap(chat.avatar_path)
        # Приводим изображение к квадрату: вырезаем центральную область.
        if not pixmap.isNull():
            original_width = pixmap.width()
            original_height = pixmap.height()
            side = min(original_width, original_height)
            crop_rect = QRect(
                (original_width - side) // 2,
                (original_height - side) // 2,
                side,
                side
            )
            square_pixmap = pixmap.copy(crop_rect).scaled(
                self.AVATAR_SIZE, 
                self.AVATAR_SIZE, 
                Qt.IgnoreAspectRatio,
                Qt.SmoothTransformation
            )
        else:
            square_pixmap = pixmap

        # Применяем соответствующую функцию закругления в зависимости от типа чата.
        if hasattr(chat, 'chat_type') and chat.chat_type == "group":
            # Функция для группового аватара с немного скругленными углами.
            rounded_pixmap = get_rounds_edges_image(square_pixmap, rounded=8)
        else:
            # Функция для круглого аватара пользователя.
            rounded_pixmap = get_rounded_image(square_pixmap, self.AVATAR_SIZE)
        
        # Рисуем аватар (позиция остается фиксированной).
        painter.drawPixmap(avatar_rect, rounded_pixmap)

        # Если чат – пользователь, и он в онлайне, рисуем индикатор онлайна.
        if (not (hasattr(chat, 'chat_type') and chat.chat_type == "group") and
            hasattr(chat, 'online') and chat.online):
            indicator_diameter = 10
            # Размещаем индикатор в правом нижнем углу аватарки.
            indicator_rect = QRect(
                avatar_rect.right() - indicator_diameter,
                avatar_rect.bottom() - indicator_diameter,
                indicator_diameter,
                indicator_diameter
            )
            # Рисуем залитый круг индикатора.
            painter.setBrush(self.ONLINE_COLOR)
            painter.setPen(Qt.NoPen)
            painter.drawEllipse(indicator_rect)

            border_width = 2
            if is_selected:
                bg_color = QColor('#4a4a4a')
                pen = QPen(bg_color, border_width)
            elif option.state & QStyle.State_MouseOver:
                bg_color = QColor('#3b3b3b')
                pen = QPen(bg_color, border_width)
            else:
                bg_color = QColor('#252529')
                pen = QPen(bg_color, border_width)

            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
            # Обводку можно нарисовать по тому же прямоугольнику; если нужно, можно увеличить размер rect
            painter.drawEllipse(indicator_rect)

        # Определяем область для текста (название чата и последнее сообщение).
        text_left = avatar_rect.right() + self.MARGIN * 2
        text_width = option.rect.width() - text_left - 80  # резерв справа для времени/счетчика

        chat_name_rect = QRect(
            text_left,
            option.rect.top() + self.MARGIN,
            text_width,
            (self.ITEM_HEIGHT - 2 * self.MARGIN) // 2
        )
        last_message_rect = QRect(
            text_left,
            chat_name_rect.bottom(),
            text_width,
            (self.ITEM_HEIGHT - 2 * self.MARGIN) // 2
        )

        # Рисуем название чата (жирным шрифтом).
        font = QFont()
        font.setBold(True)
        font.setPointSize(10)
        painter.setFont(font)
        painter.setPen(self.TEXT_COLOR)
        painter.drawText(chat_name_rect, Qt.AlignLeft | Qt.AlignVCenter, chat.chat_name)

        # Рисуем последнее сообщение (обычным шрифтом, меньшего размера и менее ярким цветом).
        font.setBold(False)
        font.setPointSize(9)
        painter.setFont(font)
        painter.setPen(QColor("#b5b5b5"))
        painter.drawText(last_message_rect, Qt.AlignLeft | Qt.AlignVCenter, 'Сообщение...')  # замените на chat.last_message при наличии

        # Рисуем время последнего сообщения.
        time_rect = QRect(
            option.rect.right() - 70,
            option.rect.top() + self.MARGIN,
            60,
            20
        )
        painter.setPen(QColor("#b5b5b5"))
        painter.drawText(time_rect, Qt.AlignRight, chat.last_message_time.strftime('%H:%M'))

        # Счетчик непрочитанных сообщений (если есть).
        if chat.unread > 0:
            counter_size = 20
            counter_rect = QRect(
                option.rect.right() - 30,
                time_rect.bottom() + 5,
                counter_size,
                counter_size
            )
            painter.setBrush(self.MAIN_COLOR)
            painter.setPen(Qt.NoPen)
            painter.drawEllipse(counter_rect)
            painter.setPen(Qt.white)
            painter.drawText(counter_rect, Qt.AlignCenter, str(chat.unread))

        painter.restore()

    def sizeHint(self, option, index):
        return QSize(option.rect.width(), self.ITEM_HEIGHT)

    def editorEvent(self, event, model, option, index):
        """
        Улучшенное отслеживание курсора:
        - При событии HoverEnter устанавливаем курсор PointingHandCursor,
        - При HoverLeave — сбрасываем курсор.
        """
        if event.type() == QEvent.HoverEnter:
            if option.widget:
                option.widget.setCursor(Qt.PointingHandCursor)
        elif event.type() == QEvent.HoverLeave:
            if option.widget:
                option.widget.unsetCursor()
        return super().editorEvent(event, model, option, index)

# class ChatWidget(QWidget):
#     def __init__(self, main_window, num, chat_model):
#         super().__init__()
#         self.main_window = main_window
#         self.model = chat_model
#         self.num = num

#         layout = QHBoxLayout()
#         layout.setContentsMargins(0, 0, 0, 0)

#         chat_info = QWidget()
#         chat_info.setStyleSheet('''QWidget {background-color: rgba(0, 0, 0, 0); color: white; padding-left: 5px;}''')

#         self.chat_info_layout = QVBoxLayout()
#         self.chat_info_layout.setSpacing(0)
#         self.chat_info_layout.setContentsMargins(0, 0, 0, 0)
#         chat_info.setLayout(self.chat_info_layout)

#         self.chat_name = QLabel(chat_model.chat_name)
#         self.chat_name.setMaximumHeight(50)
#         self.chat_name.setStyleSheet(f'''QLabel {{background-color: rgba(0, 0, 0, 0); color: {TEXT_COLOR}; font-weight: bold; font-size: 13px;}}''')
#         self.chat_info_layout.addWidget(self.chat_name)

#         self.last_message = QLabel('Сообщение...')
#         self.last_message.setMaximumHeight(50)
#         self.last_message.setStyleSheet('''QLabel {color: #b5b5b5;}''')
#         self.chat_info_layout.addWidget(self.last_message)
  
#         if chat_model.chat_type != 'group':
#             chat_avatar = ImageChanger(size=45, rounded=100, path=chat_model.avatar_path, active=False)
#             self.sensor_online = QWidget()
#             self.sensor_online.setFixedSize(14,14)
#             self.sensor_online.setObjectName('online')
#             self.sensor_online.setStyleSheet(f'''background-color: {MAIN_COLOR}; border-radius: 7px; border: 3px solid {MAIN_BOX_COLOR};''')

#             self.sensor_online_layout = QVBoxLayout()
#             self.sensor_online_layout.setContentsMargins(0,30,0,0)
#             self.sensor_online_layout.addWidget(self.sensor_online)
#             chat_avatar.setLayout(self.sensor_online_layout)
#         else:
#             chat_avatar = ImageChanger(size=45, rounded=10, path=chat_model.avatar_path, active=False)

#         self.chat_time_layout = QVBoxLayout()
#         self.chat_time_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
#         self.chat_time_layout.setSpacing(8)
#         self.chat_time_layout.setContentsMargins(0,0,0,0)

#         self.chat_time = QLabel(datetime.now().strftime('%H:%M'))
#         self.chat_time.setStyleSheet('QLabel {color: rgba(255, 255, 255, 0.5); background: rgba(0, 0, 0, 0);}')

#         # Создание эффекта свечения с использованием QGraphicsDropShadowEffect
#         self.glow = QGraphicsDropShadowEffect(self)
#         self.glow.setBlurRadius(20)  # радиус размытия
#         rgba = list(map(int, re.findall(r'\d+', MAIN_COLOR)))
#         color = QColor(rgba[0], rgba[1], rgba[2])
#         self.glow.setColor(color)  # цвет свечения
#         self.glow.setOffset(0, 0)  # смещение тени
        
#         self.new_mess = QLabel('1')
#         self.new_mess.setContentsMargins(0,0,0,0)
#         self.new_mess.setAlignment(Qt.AlignmentFlag.AlignCenter)
#         self.new_mess.setFixedSize(17,17)
#         self.new_mess.setStyleSheet(f'''QLabel {{background-color: {MAIN_COLOR}; color: white; border-radius: 8px; padding-bottom: 2px;
#                                                  font-weight: bold; font-size: 11px;}}''')
#         # Применение эффекта к new_mess
#         self.new_mess.setGraphicsEffect(self.glow)
        
#         new_mess_layout = QHBoxLayout()
#         new_mess_layout.setContentsMargins(0,0,0,0)
#         new_mess_layout.setSpacing(0)
#         new_mess_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
#         new_mess_layout.addWidget(self.new_mess)

#         self.chat_time_layout.addWidget(self.chat_time)
#         self.chat_time_layout.addLayout(new_mess_layout)

#         self.chat_layout = QHBoxLayout()
#         self.chat_layout.addWidget(chat_avatar)
#         self.chat_layout.addWidget(chat_info)
#         self.chat_layout.addStretch()
#         self.chat_layout.addLayout(self.chat_time_layout)

#         self.chat_widget = QPushButton(self)
#         self.chat_widget.setContentsMargins(5, 0, 0, 0)
#         self.chat_widget.setObjectName("chat_widget")
#         self.chat_widget.setFixedHeight(60)
#         self.chat_widget.setStyleSheet('''#chat_widget {background-color: rgba(0, 0, 0, 0); border:none; border-radius: 0px; background-color: none;} 
#                                           #chat_widget:hover {background-color: rgba(255,255,255, 0.1); border-radius: 0px;}''')
#         self.chat_widget.setCursor(QCursor(Qt.PointingHandCursor))
#         # Подключаем сигнал с передачей индекса
#         self.chat_widget.clicked.connect(lambda: self.main_window.switch_chat(self.num - 1))
#         self.chat_widget.setLayout(self.chat_layout)

#         layout.addWidget(self.chat_widget)
#         self.setLayout(layout) 

#     def contextMenuEvent(self, event):
#         """Обработчик события контекстного меню."""
#         menu = QMenu(self)

#         mute_action = menu.addAction("Замутить чат")
#         clear_action = menu.addAction("Очистить чат")
#         delete_action = menu.addAction("Удалить чат")

#         menu.setStyleSheet(context_menu_style)

#         for action in menu.actions():
#             action.setProperty("hover", True)
#         menu.setCursor(Qt.PointingHandCursor)
        
#         # Показываем меню на позиции курсора
#         action = menu.exec_(event.globalPos())
#         if action == mute_action:
#             self.mute_chat()
#         elif action == clear_action:
#             self.clear_chat()
#         elif action == delete_action:
#             self.delete_chat()

#     def mute_chat(self):
#         """Логика для мутирования чата."""
#         QMessageBox.information(None, "Чат", f"Чат замучен.")

#     def clear_chat(self):
#         """Логика для очистки чата."""
#         QMessageBox.information(None, "Чат", f"Чат очищен.")

#     def delete_chat(self):
#         """Логика для удаления чата."""
#         QMessageBox.warning(None, "Чат", f"Чат удален.")   

#     def resizeEvent(self, event):
#         if self.size().width() < 200:
#             self.chat_name.setVisible(False)
#             self.chat_time.setVisible(False)
#             self.new_mess.move(10,10)
#             self.last_message.setVisible(False)
#         else:
#             self.chat_name.setVisible(True)
#             self.chat_time.setVisible(True)
#             self.new_mess.setVisible(True)
#             self.last_message.setVisible(True)
#         super().resizeEvent(event)


# class PrivateChatWidget(ChatWidget):
#     '''Личный чат между двумя людьми. '''
#     def __init__(self, main_window, model: ChatModel):
#         super().__init__(main_window, model)


# class GroupChatWidget(ChatWidget):
#     '''Публичный чат для нескольких пользователей. '''
#     def __init__(self, main_window, model: ChatModel):
#         super().__init__(main_window, model)


# class GroupChat(QWidget):
#     '''Групповой чат, в котором может быть несколько чатов. '''
#     def __init__(self):
#         super().__init__()
