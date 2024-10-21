from PySide6.QtGui import QPainterPath, QPixmap, QPainter
from PySide6.QtCore import Qt, QRect

def get_rounds_edges_image(self, pixmap):
    '''Закругляет все края изоброжения.'''
    size = pixmap.size()
    rounded_pixmap = QPixmap(size)
    rounded_pixmap.fill(Qt.transparent)  # Прозрачный фон

    painter = QPainter(rounded_pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setBrush(QPixmap(pixmap))  # Исходное изображение
    painter.setPen(Qt.NoPen)
    
    # Рисуем закругленные углы
    painter.drawRoundedRect(QRect(0, 0, size.width(), size.height()), 110, 110)
    painter.end()

    return rounded_pixmap

def get_top_rounded_image(pixmap: QPixmap, radius: int) -> QPixmap:
    '''Закругляет только верхние края изображения.'''
    size = pixmap.size()
    rounded_pixmap = QPixmap(size)
    rounded_pixmap.fill(Qt.GlobalColor.transparent)  # Прозрачный фон

    # Создаем painter для закрашивания изображения
    painter = QPainter(rounded_pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    
    # Закрашиваем маску закругленных углов только для верхних краев
    rect = QRect(0, 0, size.width(), size.height())

    # Рисуем только верхние углы с закруглением
    path = QPainterPath()
    path.moveTo(0, radius)
    path.arcTo(0, 0, 2 * radius, 2 * radius, 180, -90)
    path.lineTo(size.width() - radius, 0)
    path.arcTo(size.width() - 2 * radius, 0, 2 * radius, 2 * radius, 90, -90)
    path.lineTo(size.width(), radius)
    path.lineTo(size.width(), size.height())
    path.lineTo(0, size.height())
    path.closeSubpath()

    # Создаем маску и заполняем её изображением
    painter.setClipPath(path)
    painter.drawPixmap(0, 0, pixmap)
    
    painter.end()

    return rounded_pixmap

def get_rounded_image(self, pixmap):
    '''Делает изображение круглым.'''
    size = pixmap.size()
    side = min(size.width(), size.height())  # Размер круга будет наименьшей стороной изображения

    # Создаем квадратное изображение для маски с прозрачным фоном
    rounded_pixmap = QPixmap(side, side)
    rounded_pixmap.fill(Qt.transparent)  # Прозрачный фон

    # Настраиваем QPainter для рисования
    painter = QPainter(rounded_pixmap)
    painter.setRenderHint(QPainter.Antialiasing)

    # Создаем эллипс (круг) для маски
    path = QPainterPath()
    path.addEllipse(0, 0, side, side)

    # Обрезаем изображение по форме круга
    painter.setClipPath(path)
    painter.drawPixmap(0, 0, pixmap.scaled(side, side, Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation))

    painter.end()

    return rounded_pixmap
