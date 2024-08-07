import sys
from PySide6.QtCore import Qt
from PySide6.QtGui import QFontMetrics, QIcon, QCursor, QPixmap
from PySide6.QtWidgets import QMainWindow, QApplication, QWidget, QPushButton, QHBoxLayout, QVBoxLayout, QLabel

from apps.chat.style import BG_COLOR, MAIN_BOX_COLOR, scroll_style

class Window(QMainWindow):
    """Класс для создания окон. """
    def __init__(self) -> None:
        super(Window, self).__init__()

        # Базовые настройки MainWindow
        self.setWindowTitle("PepeChat")
        self.setMinimumSize(700, 600)
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
        self.main_layout.setContentsMargins(7, 7, 7, 7)
        self.main_layout.setSpacing(5)

        # Слой окна
        self.window_layout = QVBoxLayout()
        self.window_layout.setContentsMargins(0,0,0,0)
        self.window_layout.setSpacing(0)

        # Кнопка закрытия окна
        self.close_btn = QPushButton('X')
        self.close_btn.clicked.connect(self.close)
        self.close_btn.setFixedSize(50, 30)
        self.close_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.close_btn.setStyleSheet('''QPushButton {color: white; border: none;}
                                        QPushButton:hover {background-color: #fd5858;}''')

        # Кнопка сворачивания окна
        self.hide_btn = QPushButton('_')
        self.hide_btn.clicked.connect(self.showMinimized)
        self.hide_btn.setFixedSize(50, 30)
        self.hide_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.hide_btn.setStyleSheet('''QPushButton {color: white; border: none;}
                                       QPushButton:hover {background-color: grey;}''')
        
        # Верхняя панель
        self.top_panel = QWidget()
        self.top_panel.setStyleSheet(f'''QWidget {{background-color: {MAIN_BOX_COLOR};}}''')
        self.top_panel.setFixedHeight(30)

        self.top_panel_layout = QHBoxLayout()
        self.top_panel_layout.setContentsMargins(0,0,0,0)
        self.top_panel_layout.setSpacing(0)

        self.window_title = QLabel(self.windowTitle())
        self.window_title.setStyleSheet('''QLabel {color: grey; margin-left: 14px; font-weight: bold;}''')
        self.top_panel_layout.addWidget(self.window_title)

        self.top_panel_layout.addStretch()
        self.top_panel_layout.addWidget(self.hide_btn)
        self.top_panel_layout.addWidget(self.close_btn)
        
        self.top_panel.setLayout(self.top_panel_layout)

        self.main.setLayout(self.window_layout)

        # Перетаскивание при зажатии верхней панели
        self.top_panel.mousePressEvent = self.topPanelMousePressEvent
        self.top_panel.mouseMoveEvent = self.topPanelMouseMoveEvent
        
        self.window_layout.addWidget(self.top_panel)
        self.window_layout.addLayout(self.main_layout)
        self.window_layout.addStretch()

        self.setCentralWidget(self.main)

    def topPanelMousePressEvent(self, event):
        """Функция зажатия верхней панели окна. """
        self.oldPos = event.globalPosition().toPoint()

    def topPanelMouseMoveEvent(self, event):
        """Функция изменения расположения окна при зажатии верхней панели. """
        try:
            delta = event.globalPosition().toPoint() - self.oldPos
            self.move(self.x() + delta.x(), self.y() + delta.y())
            self.oldPos = event.globalPosition().toPoint()
        except AttributeError:
            pass
