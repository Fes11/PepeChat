from PySide6.QtCore import Qt
from PySide6.QtGui import QMouseEvent
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel


class ResizableWidget(QWidget):
    def __init__(self, width=300, height=500):
        super().__init__()
        self.setFixedHeight(height)
        self.setGeometry(100, 100, width, height)
        self.setMinimumWidth(100)  # Минимальная ширина виджета
        self.setMouseTracking(True)  # Включаем отслеживание движения мыши

        # Внутренний layout и пример содержимого
        layout = QVBoxLayout()
        layout.addWidget(QLabel("Тяните за правый край, чтобы изменить ширину"))
        self.setLayout(layout)

        # Определение переменных для отслеживания состояния
        self.resizing = False
        self.resize_margin = 8  # Чувствительная зона для изменения размера

    def mousePressEvent(self, event: QMouseEvent):
        # Проверяем, если мышь находится рядом с правым краем для начала изменения размера
        if self.is_on_resize_margin(event.position()):
            self.resizing = True
            self.start_pos = event.globalPosition().x()
            self.start_width = self.width()

    def mouseMoveEvent(self, event: QMouseEvent):
        # Если resizing активно, изменяем ширину в зависимости от положения курсора
        if self.resizing:
            delta = event.globalPosition().x() - self.start_pos
            new_width = self.start_width + delta
            # Устанавливаем новую ширину, проверяя, чтобы она не была меньше минимальной и не превышала максимальную
            self.setFixedWidth(max(self.minimumWidth(), min(int(new_width), self.maximumWidth())))
        else:
            # Меняем курсор при наведении на правый край
            if self.is_on_resize_margin(event.position()):
                self.setCursor(Qt.SizeHorCursor)
            else:
                self.setCursor(Qt.ArrowCursor)

    def mouseReleaseEvent(self, event: QMouseEvent):
        self.resizing = False

    def is_on_resize_margin(self, pos):
        # Проверяем, находится ли курсор в зоне чувствительности resize_margin справа
        return self.width() - int(pos.x()) <= self.resize_margin


if __name__ == "__main__":
    app = QApplication([])
    widget = ResizableWidget()
    widget.show()
    app.exec()
