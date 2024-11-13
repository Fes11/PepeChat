from PySide6.QtWidgets import QGraphicsBlurEffect

from PySide6.QtGui import QColor
from PySide6.QtWidgets import (QGraphicsDropShadowEffect)

# Тестовые цвета
MAIN_COLOR = 'rgba(235, 63, 63, 1);'
HOVER_MAIN_COLOR = 'rgba(235, 35, 35, 1);'

# PGV тема
# MAIN_COLOR = 'rgba(57, 194, 54, 1);'
# HOVER_MAIN_COLOR = 'rgba(92, 191, 90, 1);'

# Основной цвет
# MAIN_COLOR = 'rgba(123, 97, 255, 1);'
# HOVER_MAIN_COLOR = 'rgba(142, 120, 255, 1);'

# BG_COLOR = 'rgba(30, 27, 19, 1)'

# Светлая тема
# BG_COLOR = 'rgba(227, 229, 232, 1);'
# MAIN_BOX_COLOR = 'rgba(255,255,255, 1)'
# MAIN_COLOR = 'rgba(123, 97, 255, 1);'
# NOT_USER_BUBLS = '#F3F3F3'
# TEXT_COLOR = 'rgba(0,0,0, 0.8)'
# HOVER_MAIN_COLOR = 'rgba(123, 97, 255, 0.7);'

# Темная тема
BG_COLOR = 'rgba(23, 24, 27, 1)'
MAIN_BOX_COLOR = 'rgba(37, 37, 41, 1)'

NOT_USER_BUBLS = 'rgba(255,255,255, 0.2)'
TEXT_COLOR = 'white'


MAIN_COLOR_GRADIENT = 'qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, stop: 0 #3D4E99, stop: 0.48 #5753C9, stop: 1 #6E7FF3);'

 # Создаем эффект размытия
blur_effect = QGraphicsBlurEffect()
blur_effect.setBlurRadius(5)

# Создание эффекта свечения с использованием QGraphicsDropShadowEffect
glow = QGraphicsDropShadowEffect()
glow.setBlurRadius(20)  # радиус размытия
glow.setColor(QColor(123, 97, 255))  # цвет свечения
glow.setOffset(0, 0)  # смещение тени

scroll_style = '''QScrollBar:vertical {
    background-color: rgba(0, 0, 0, 1);
    width: 3px;
    border-radius: 3px;
}

QScrollBar::handle:vertical {
    background-color: rgba(255, 255, 255, 0.3);
    min-height: 30px;
    border-radius: 3px; /* Закругление краёв */
}

QScrollBar::handle:vertical:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

QScrollBar::handle:vertical:pressed {
    background-color: rgba(255, 255, 255, 0.2);
}

QScrollBar::sub-line:vertical,
QScrollBar::add-line:vertical {
    width: 0px;
}

QScrollBar::up-arrow:vertical,
QScrollBar::down-arrow:vertical,
QScrollBar::add-page:vertical,
QScrollBar::sub-page:vertical {
    background: none;
}'''

send_btn_style = '''QPushButton {background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 5px;}
                    QPushButton:hover {background-color: rgba(255, 255, 255, 0.4);}'''
