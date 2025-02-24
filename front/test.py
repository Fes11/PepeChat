from PySide6.QtWidgets import QWidget, QLabel, QFileDialog
from PySide6.QtGui import QPixmap, QPainterPath, QPainter
from PySide6.QtCore import Qt, QSize, QRect
from PySide6.QtWidgets import QApplication, QMainWindow


class AvatarWidget(QLabel):
    def __init__(self, size=45, parent=None):
        super().__init__(parent)
        self.setFixedSize(size, size)
        self.setCursor(Qt.PointingHandCursor)

        self.default_pixmap = self.create_circle_pixmap(QPixmap(size, size))  # Серый круг по умолчанию
        self.setPixmap(self.default_pixmap)

        self.setAcceptDrops(True)  # Включаем поддержку Drag & Drop

    def paintEvent(self, event):
        """Рисует круглую аватарку."""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)

        if not self.pixmap() or self.pixmap().isNull():
            return

        # Создаем круглую маску
        path = QPainterPath()
        path.addEllipse(self.rect())

        painter.setClipPath(path)  # Обрезаем область под круг
        painter.drawPixmap(self.rect(), self.pixmap())  # Рисуем картинку

    def mousePressEvent(self, event):
        """Вызывает диалог выбора файла при клике."""
        if event.button() == Qt.LeftButton:
            file_path, _ = QFileDialog.getOpenFileName(self, "Выберите изображение", "", "Images (*.png *.jpg *.jpeg)")
            if file_path:
                self.set_avatar(file_path)

    def set_avatar(self, file_path):
        """Загружает изображение и делает его круглым."""
        pixmap = QPixmap(file_path)
        if pixmap.isNull():
            return

        # Обрезаем изображение в квадрат и масштабируем
        size = min(pixmap.width(), pixmap.height())
        rect = QRect((pixmap.width() - size) // 2, (pixmap.height() - size) // 2, size, size)
        pixmap = pixmap.copy(rect).scaled(self.size(), Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)

        # Создаем круглую версию изображения
        self.setPixmap(self.create_circle_pixmap(pixmap))

    def create_circle_pixmap(self, pixmap):
        """Обрезает изображение в круг и возвращает `QPixmap`."""
        size = min(self.width(), self.height())
        circle_pixmap = QPixmap(size, size)
        circle_pixmap.fill(Qt.transparent)  # Прозрачный фон

        painter = QPainter(circle_pixmap)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)

        # Создаем круглую маску
        path = QPainterPath()
        path.addEllipse(0, 0, size, size)
        painter.setClipPath(path)

        # Рисуем изображение
        painter.drawPixmap(0, 0, size, size, pixmap)
        painter.end()

        return circle_pixmap

    # === DRAG & DROP ===
    def dragEnterEvent(self, event):
        """Разрешаем перетаскивание только изображений."""
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event):
        """Обрабатываем перетаскивание файла."""
        urls = event.mimeData().urls()
        if urls:
            file_path = urls[0].toLocalFile()
            self.set_avatar(file_path)



class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Avatar Widget")
        self.setFixedSize(300, 300)

        self.avatar = AvatarWidget(size=140, parent=self)
        self.avatar.setStyleSheet('background-color: rgba(0,0,0, 0.2); border-radius: 70px;')
        self.avatar.move(75, 75)  # Центрируем

if __name__ == "__main__":
    app = QApplication([])
    window = MainWindow()
    window.show()
    app.exec()
