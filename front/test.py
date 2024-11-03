from PySide6.QtWidgets import QApplication, QMainWindow, QDialog, QLabel, QPushButton, QVBoxLayout, QWidget
from PySide6.QtCore import Qt
from PySide6.QtGui import QIcon, QColor, QPalette
import sys

# Базовый класс кастомного окна
class CustomWindow(QMainWindow):
    def __init__(self, title="Custom Window", parent=None):
        super().__init__(parent)
        
        # Настройка окна
        self.setWindowTitle(title)
        self.setGeometry(100, 100, 600, 400)
        
        # Убираем стандартную рамку окна
        self.setWindowFlag(Qt.FramelessWindowHint)
        
        # Устанавливаем цвет фона и стили
        self.setStyleSheet("""
            QMainWindow {
                background-color: #2c3e50;
                color: white;
                border: 2px solid #3498db;
                border-radius: 10px;
            }
            QPushButton {
                background-color: #3498db;
                border: none;
                padding: 8px;
                color: white;
                font-size: 16px;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #2980b9;
            }
        """)
        
        # Кнопка закрытия окна
        close_button = QPushButton("X", self)
        close_button.setFixedSize(30, 30)
        close_button.move(570, 10)
        close_button.clicked.connect(self.close)
        
    def add_content(self, widget):
        layout = QVBoxLayout()
        layout.addWidget(widget)
        central_widget = self.centralWidget()
        if not central_widget:
            central_widget = QWidget()
            self.setCentralWidget(central_widget)
        central_widget.setLayout(layout)

# Основное окно
class MainWindow(CustomWindow):
    def __init__(self):
        super().__init__("Main Window")
        
        # Текстовый элемент и кнопка для открытия диалогового окна
        label = QLabel("Это основное окно", self)
        label.setAlignment(Qt.AlignCenter)
        
        open_dialog_button = QPushButton("Открыть диалог", self)
        open_dialog_button.clicked.connect(self.open_dialog)
        
        # Добавляем элементы на окно
        self.add_content(label)
        self.add_content(open_dialog_button)
        
    def open_dialog(self):
        dialog = CustomDialog(self)
        dialog.exec()

# Диалоговое окно
class CustomDialog(QDialog, CustomWindow):
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Настройка диалогового окна
        self.setWindowTitle("Диалоговое окно")
        self.setFixedSize(300, 200)
        
        # Добавляем текстовый элемент и кнопку закрытия
        label = QLabel("Это диалоговое окно", self)
        label.setAlignment(Qt.AlignCenter)
        
        close_button = QPushButton("Закрыть", self)
        close_button.clicked.connect(self.close)
        
        # Размещение элементов в диалоговом окне
        layout = QVBoxLayout()
        layout.addWidget(label)
        layout.addWidget(close_button)
        self.setLayout(layout)

# Инициализация приложения
if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Создаем основное окно
    main_window = MainWindow()
    main_window.show()
    
    # Запуск приложения
    sys.exit(app.exec())
