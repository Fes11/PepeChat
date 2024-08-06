import sys
from PySide6.QtCore import Qt
from PySide6.QtGui import QFontMetrics, QIcon, QCursor, QPixmap
from PySide6.QtWidgets import QMainWindow, QApplication, QWidget, QPushButton, QHBoxLayout, QVBoxLayout

from apps.chat.style import BG_COLOR, MAIN_BOX_COLOR, scroll_style

class Window(QMainWindow):
    """Класс для создания окон. """
    def __init__(self) -> None:
        super(Window, self).__init__()
        
        # Базовые настройки MainWindow
        self.setWindowTitle("My App")
        self.setMinimumSize(700, 600)
        self.setStyleSheet(scroll_style)

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


# app = QApplication(sys.argv)

# window = Window()
# window2 = Window()
# window2.setMinimumSize(300, 200)

# window.show()
# window2.show()

# app.exec()
