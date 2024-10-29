from PySide6.QtGui import QPainterPath, QPixmap, QPainter, QBrush
from PySide6.QtCore import Qt, QRect
from PIL import Image, ImageEnhance, ImageFilter

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

from PySide6.QtGui import QPixmap, QPainter, QPainterPath
from PySide6.QtCore import QRectF, Qt

def create_rounded_pixmap(pixmap, radius):
    # Создание пустого QPixmap для круглого изображения
    rounded_pixmap = QPixmap(pixmap.size())
    rounded_pixmap.fill(Qt.transparent)  # Прозрачный фон

    # Настройка QPainter для рисования закругленного изображения
    painter = QPainter(rounded_pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    
    # Создание закругленной маски
    path = QPainterPath()
    path.addRoundedRect(QRectF(pixmap.rect()), radius, radius)
    
    # Применение маски и рисование изображения
    painter.setClipPath(path)
    painter.drawPixmap(0, 0, pixmap)
    painter.end()  # Завершаем рисование

    return rounded_pixmap

def scaled_image(image_path):
        original_pixmap = QPixmap(image_path)
        
        # Получаем исходные размеры изображения
        original_size = original_pixmap.size()
        
        # Проверяем размеры и изменяем в два раза в зависимости от условий
        if original_size.width() > 1024 and original_size.height() > 700:
            # Уменьшаем изображение в два раза
            new_size = original_size / 6
        else:
             new_size = original_size
        # Масштабируем изображение до нового размера
        scaled_pixmap = original_pixmap.scaled(
            new_size.width(),
            new_size.height()
        )
        
        return scaled_pixmap


def darken_image(image_path, output_path):
    # Открываем изображение
    image = Image.open(image_path)
    
    # Затемняем изображение
    enhancer = ImageEnhance.Brightness(image)
    darkened_image = enhancer.enhance(0.8)  # Чем меньше значение, тем сильнее затемнение (0.6 - умеренное затемнение)
    
    # Применяем размытие
    # blurred_image = darkened_image.filter(ImageFilter.GaussianBlur(3))  # Значение радиуса размытия (5 - умеренное размытие)
    
    # Сохраняем результат
    darkened_image.save(output_path)
