import sys
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QPushButton
from PySide6.QtCore import Qt

class ClickableWidget(QWidget):
    def __init__(self):
        super().__init__()

        self.setStyleSheet("background-color: lightblue;")
        self.setGeometry(100, 100, 300, 200)

        layout = QVBoxLayout()

        # Вложенный виджет
        self.inner_widget = QLabel("I am inside", self)
        self.inner_widget.setStyleSheet("background-color: lightgray; padding: 20px;")
        self.inner_widget.move(50, 50)

        # Делаем вложенный виджет невосприимчивым к событиям мыши
        self.inner_widget.setAttribute(Qt.WA_TransparentForMouseEvents)

        self.setLayout(layout)

    def mousePressEvent(self, event):
        print("Parent widget clicked!")
        super().mousePressEvent(event)


if __name__ == "__main__":
    app = QApplication(sys.argv)

    widget = ClickableWidget()
    widget.show()

    sys.exit(app.exec())
