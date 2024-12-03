from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QFrame, QPushButton, QHBoxLayout
from PySide6.QtGui import QColor, QPainter
from PySide6.QtCore import Qt

class ColorPalette(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Color Palette Inside Widget")
        self.setGeometry(100, 100, 400, 300)

        # Основной layout
        self.main_layout = QVBoxLayout(self)

        # Метка для отображения выбранного цвета
        self.color_label = QLabel("Выбранный цвет: None")
        self.color_label.setStyleSheet("background-color: none; padding: 10px; font-size: 16px;")
        self.main_layout.addWidget(self.color_label)

        # Виджет с палитрой цветов
        self.palette_frame = QFrame()
        self.palette_frame.setFixedHeight(150)
        self.palette_frame.setStyleSheet("background-color: #f0f0f0; border: 1px solid #ccc;")
        self.main_layout.addWidget(self.palette_frame)

        # Layout для палитры внутри frame
        self.palette_layout = QHBoxLayout(self.palette_frame)

        # Список цветов
        self.colors = [
            "#FF5733", "#33FF57", "#3357FF", "#FFFF33", 
            "#FF33FF", "#33FFFF", "#AAAAAA", "#000000", 
            "#FFFFFF", "#FF8800", "#8800FF", "#0088FF"
        ]

        self.create_color_palette()

    def create_color_palette(self):
        """Создаёт кнопки-палитру внутри виджета"""
        for color in self.colors:
            color_button = QPushButton()
            color_button.setFixedSize(40, 40)
            color_button.setStyleSheet(f"background-color: {color}; border: 1px solid #000;")
            color_button.clicked.connect(lambda _, c=color: self.set_selected_color(c))
            self.palette_layout.addWidget(color_button)

    def set_selected_color(self, color):
        """Обновляет метку выбранным цветом"""
        self.color_label.setText(f"Выбранный цвет: {color}")
        self.color_label.setStyleSheet(f"background-color: {color}; color: {'#000' if color != '#000000' else '#FFF'}; padding: 10px; font-size: 16px;")

if __name__ == "__main__":
    app = QApplication([])
    demo = ColorPalette()
    demo.show()
    app.exec()
