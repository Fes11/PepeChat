from window import Window
from PySide6.QtWidgets import QLabel
from PySide6.QtCore import Qt
from PySide6.QtGui import QPixmap


class MediaView(Window):
    '''Фулскрин окно с изображением.'''
    def __init__(self, image=''):
        super(MediaView, self).__init__()
        self.image = image
        # Устанавливаем окно на весь экран
        self.showFullScreen()
        
        # Полупрозрачный фон для основного виджета MediaView
        self.main.setStyleSheet("background-color: rgba(0, 0, 0, 0.7);")
        
        # Создаем метку с текстом
        self.image = QLabel(self.main)
        self.image.setAlignment(Qt.AlignCenter)
        self.image.setStyleSheet("background-color: rgba(0, 0, 0, 0); color: white; font-size: 24px; padding: 10px;")
        self.image.setPixmap(QPixmap(image))
        
        # Добавляем метку в основной слой
        self.window_layout.addWidget(self.image)
    
    def mousePressEvent(self, event):
        '''Закрывает окно при нажатии на любое место, включая изображение.'''
        self.close()
