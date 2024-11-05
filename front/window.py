import sys
import ctypes
from PySide6.QtCore import Qt, QSize, QEvent
from PySide6.QtGui import QIcon, QCursor, QIcon, QAction, QCursor
from PySide6.QtWidgets import (QMainWindow, QApplication, QWidget, QPushButton, QHBoxLayout, QVBoxLayout, 
                               QLabel, QSizeGrip, QApplication, QMainWindow, QSystemTrayIcon, QMenu)

from BlurWindow.blurWindow import GlobalBlur

from apps.chat.style import BG_COLOR, MAIN_BOX_COLOR, scroll_style

class Window(QMainWindow):
    """Класс для создания окон. """
    def __init__(self) -> None:
        super(Window, self).__init__()
        self.setGeometry(350,170, 1100, 750)

        # BG_COLOR = 'rgba(0,0,0,0.6)'
        # GlobalBlur(self.winId(), Acrylic=True, QWidget=self) # Сильный блюр

        # BG_COLOR = 'rgba(0,0,0,0.7)'
        # GlobalBlur(self.winId(), QWidget=self) # Обычный блюр

        # Базовые настройки
        self.setWindowTitle("PepeChat")
        self.setMinimumSize(840, 570)
        self.resize_margin = 10
        self.setStyleSheet(scroll_style + '''QWidget {background-color: rgba(0,0,0,0);}''')

        # Убирает стандартные рамки окна
        self.setAutoFillBackground(False)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Устанавливаю иконку окна в панели задач
        myappid = 'mycompany.myproduct.subproduct.version'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
        self.setWindowIcon(QIcon('static/image/logo.png'))

        # Основной виджет в который добавляються все остальные слои
        self.main = QWidget()
        self.main.setObjectName('main')
        self.main.setGeometry(0, 0, self.width(), self.height())
        self.main.setStyleSheet(f'''#main {{background-color: {BG_COLOR}; border-radius: 10px;}}''')

        # Основной слой в который добавляються виджеты
        self.main_layout = QHBoxLayout()
        self.main_layout.setContentsMargins(7, 0, 7, 7)
        self.main_layout.setSpacing(5)

        # Слой окна
        self.window_layout = QVBoxLayout()
        self.window_layout.setContentsMargins(0,0,0,0)
        self.window_layout.setSpacing(0)

        self.top_panel = TopPanel(self)
        self.top_panel.setStyleSheet(f"background-color: grey;")

        self.window_layout.addWidget(self.top_panel)
        self.window_layout.addLayout(self.main_layout)

        self.main.setLayout(self.window_layout)

        self.setCentralWidget(self.main)

        self.sizegrip = QSizeGrip(self.main)
        self.sizegrip.setStyleSheet("width: 5px; height: 5px; margin 0px; padding: 0px;")
    
        # Создаем иконку для системного трея
        self.tray_icon = QSystemTrayIcon(QIcon("static/image/logo.png"), self)
        
        # Добавляем контекстное меню для иконки в трее
        self.tray_menu = QMenu()

        # Действие для отображения/скрытия окна
        show_action = QAction("Показать/Скрыть окно", self)
        show_action.triggered.connect(self.toggle_visibility)
        self.tray_menu.addAction(show_action)

        # Действие для выхода из приложения
        exit_action = QAction("Выход", self)
        exit_action.triggered.connect(self.exit_application)
        self.tray_menu.addAction(exit_action)
        
        # Устанавливаем меню для иконки
        self.tray_icon.setContextMenu(self.tray_menu)

        # Подключаем событие нажатия на иконку
        self.tray_icon.activated.connect(self.on_tray_icon_click)
        
        # Показываем иконку в трее
        self.tray_icon.show()

    def closeEvent(self, event):
        # Скрываем окно и показываем уведомление при закрытии
        event.ignore()
        self.hide()
        # self.tray_icon.showMessage(
        #     "Приложение свернуто",
        #     "Приложение было свернуто в трей. Для отображения нажмите на иконку.",
        #     QSystemTrayIcon.Information,
        #     2000
        # )

    def on_tray_icon_click(self, reason):
        # Проверяем, какой кнопкой нажали на иконку в трее
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self.toggle_visibility()
        elif reason == QSystemTrayIcon.ActivationReason.Context:
            # Открываем контекстное меню
            self.tray_menu.exec(QCursor.pos())

    def toggle_visibility(self):
        # Показываем или скрываем окно при нажатии на иконку
        if self.isVisible():
            self.hide()
        else:
            self.showNormal()  # Для отображения в обычном режиме

    def exit_application(self):
        # Полностью закрывает приложение
        QApplication.instance().quit()

    def swetch_screen(self, new_widget):
        '''Изменяет экранн (то что показывается в окне)'''

        # Удаляем старый виджет (LoginWindow)
        if self.main_layout.count() > 0:
            old_widget = self.main_layout.itemAt(0).widget()
            if old_widget is not None:
                old_widget.setParent(None)
                old_widget.deleteLater()
        
        # Добавляем новый виджет (ChatWindow)
        self.main_layout.addWidget(new_widget)


class TopPanel(QWidget):
    def __init__(self, parent):
        super().__init__()
        height = 30
        width = 34
        icon_size = 20

        self.parent = parent
        self.setStyleSheet('''QWidget {background-color: rgba(0,0,0,0); border: none;}''')
        self.setMaximumHeight(height)
        
        self.top_panel_layout = QHBoxLayout(self)
        self.top_panel_layout.setContentsMargins(0, 0, 7, 0)
        self.top_panel_layout.setSpacing(0)

        self.window_title = QLabel('PepeChat')
        self.window_title.setStyleSheet('''QLabel {background-color: rgba(0,0,0,0); color: grey; margin-left: 14px; font-weight: bold;}''')
        self.top_panel_layout.addWidget(self.window_title)
        self.top_panel_layout.addStretch()
        
        self.close_btn = QPushButton()
        self.close_btn.setFixedSize(width, height)
        self.close_btn.setIcon(QIcon('static/image/close_hover.png'))
        self.close_btn.setIconSize(QSize(icon_size, icon_size))
        self.close_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.close_btn.setStyleSheet('''QPushButton {background-color: rgba(0,0,0,0); border: none;} QPushButton:hover {background-color: #fd5858;}''')
        self.close_btn.clicked.connect(self.parent.close)
        
        self.hide_btn = QPushButton()
        self.hide_btn.setFixedSize(width, height)
        self.hide_btn.setIcon(QIcon('static/image/hide_hover.png'))
        self.hide_btn.setIconSize(QSize(icon_size, icon_size))
        self.hide_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.hide_btn.setStyleSheet(f'''QPushButton {{background-color: rgba(0,0,0,0);}} QPushButton:hover {{background-color: {MAIN_BOX_COLOR};}}''')
        self.hide_btn.clicked.connect(self.parent.showMinimized)

        self.is_fullscreen = False
        self.normal_geometry = self.geometry()

        self.fill_scrine_btn = QPushButton()
        self.fill_scrine_btn.setFixedSize(width, height)
        self.fill_scrine_btn.setIcon(QIcon('static/image/full_scrin_hover.png'))
        self.fill_scrine_btn.setIconSize(QSize(icon_size, icon_size))
        self.fill_scrine_btn.setCursor(QCursor(Qt.PointingHandCursor))
        self.fill_scrine_btn.setStyleSheet(f'''QPushButton {{background-color: rgba(0,0,0,0);}} QPushButton:hover {{background-color: {MAIN_BOX_COLOR};}}''')
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
            # self.parent.main.setStyleSheet(f'''#main {{background-color: {BG_COLOR}; border-radius: 0px;}}''')
        else:
            self.parent.showNormal()
            # self.parent.main.setStyleSheet(f'''#main {{background-color: {BG_COLOR}; border-radius: 10px;}}''')

        # Переключаем флаг состояния окна
        self.is_fullscreen = not self.is_fullscreen
