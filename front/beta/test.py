import sys
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import QApplication, QWidget, QSizeGrip, QVBoxLayout, QLabel

class ResizableWidget(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("Custom Resizable Widget")
        self.setGeometry(100, 100, 300, 200)

        # Layout for the widget
        layout = QVBoxLayout(self)

        # A label to show some content
        label = QLabel("This is a resizable widget", self)
        layout.addWidget(label)

        # QSizeGrip for resizing
        size_grip = QSizeGrip(self)
        layout.addWidget(size_grip, 0, alignment=Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignRight)

        # Set the layout to the widget
        self.setLayout(layout)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    resizable_widget = ResizableWidget()
    resizable_widget.show()
    sys.exit(app.exec())
