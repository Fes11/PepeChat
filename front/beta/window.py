import sys
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QFontMetrics, QIcon, QCursor, QPixmap
from PySide6.QtWidgets import QMainWindow, QApplication, QWidget, QPushButton, QHBoxLayout, QVBoxLayout, QLabel

from apps.chat.style import BG_COLOR, MAIN_BOX_COLOR, scroll_style

class Window(QMainWindow):
    """Класс для создания окон. """
    def __init__(self) -> None:
        super(Window, self).__init__()

        # Базовые настройки MainWindow
        self.setWindowTitle("PepeChat")
        self.setMinimumSize(700, 612)
        self.setStyleSheet(scroll_style)

        # Убирает стандартные рамки окна
        self.setAutoFillBackground(False)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)

        # Основной виджет в который добавляються все остальные слои
        self.main = QWidget()
        self.main.setGeometry(0, 0, self.width(), self.height())
        self.main.setStyleSheet(f'''QWidget {{background-color: {BG_COLOR};}}''')
        # Основной слой в который добавляються виджеты
        self.main_layout = QHBoxLayout()
        self.main_layout.setContentsMargins(7, 0, 7, 0)
        self.main_layout.setSpacing(5)

        # Слой окна
        self.window_layout = QVBoxLayout()
        self.window_layout.setContentsMargins(0,0,0,0)
        self.window_layout.setSpacing(0)

        self.main.setLayout(self.window_layout)

        
        self.window_layout.addWidget(TopPanel(self))
        self.window_layout.addLayout(self.main_layout)
        self.window_layout.addStretch()

        self.setCentralWidget(self.main)


class TopPanel(QWidget):

    def __init__(self, parent):
        super().__init__()
        height = 30
        width = 34
        icon_size = 20

        self.parent = parent
        self.setStyleSheet('''QPushButton {border: none;}''')
        
        self.top_panel_layout = QHBoxLayout(self)
        self.top_panel_layout.setContentsMargins(0, 0, 7, 0)
        self.top_panel_layout.setSpacing(0)

        self.window_title = QLabel('PepeChat')
        self.window_title.setStyleSheet('''QLabel {color: grey; margin-left: 14px; font-weight: bold;}''')
        self.top_panel_layout.addWidget(self.window_title)
        
        self.close_btn = QPushButton()
        self.close_btn.setFixedSize(width, height)
        self.close_btn.setIcon(QIcon('static/image/close.png'))
        self.close_btn.setIconSize(QSize(icon_size, icon_size))
        self.close_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.close_btn.setStyleSheet('''QPushButton:hover {background-color: #fd5858;}''')
        self.close_btn.clicked.connect(self.parent.close)
        
        self.hide_btn = QPushButton()
        self.hide_btn.setFixedSize(width, height)
        self.hide_btn.setIcon(QIcon('static/image/hide.png'))
        self.hide_btn.setIconSize(QSize(icon_size, icon_size))
        self.hide_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.hide_btn.setStyleSheet(f'''QPushButton:hover {{background-color: {MAIN_BOX_COLOR};}}''')
        self.hide_btn.clicked.connect(self.parent.showMinimized)

        self.is_fullscreen = False
        self.normal_geometry = self.geometry()

        self.fill_scrine_btn = QPushButton()
        self.fill_scrine_btn.setFixedSize(width, height)
        self.fill_scrine_btn.setIcon(QIcon('static/image/full_scrin.png'))
        self.fill_scrine_btn.setIconSize(QSize(icon_size, icon_size))
        self.fill_scrine_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.fill_scrine_btn.setStyleSheet(f'''QPushButton:hover {{background-color: {MAIN_BOX_COLOR};}}''')
        self.fill_scrine_btn.clicked.connect(self.toggle_fullscreen)
        
        self.top_panel_layout.addWidget(self.hide_btn)
        self.top_panel_layout.addWidget(self.fill_scrine_btn)
        self.top_panel_layout.addWidget(self.close_btn)
        
        # Перетаскивание при зажатии верхней панели
        self.mousePressEvent = self.topPanelMousePressEvent
        self.mouseMoveEvent = self.topPanelMouseMoveEvent

    def topPanelMousePressEvent(self, event):
        self.parent.oldPos = event.globalPosition().toPoint()
        self.parent.showNormal()
        self.is_fullscreen = False

    def topPanelMouseMoveEvent(self, event):
        try:
            delta = event.globalPosition().toPoint() - self.parent.oldPos
            self.parent.move(self.parent.x() + delta.x(), self.parent.y() + delta.y())
            self.parent.oldPos = event.globalPosition().toPoint()
        except AttributeError:
            pass
    
    def toggle_fullscreen(self):
        if not self.is_fullscreen:
            # Запоминаем текущие размеры и положение окна
            self.parent.normal_geometry = self.parent.geometry()
            self.parent.showMaximized()
        else:
            self.parent.showNormal()

        # Переключаем флаг состояния окна
        self.is_fullscreen = not self.is_fullscreen
