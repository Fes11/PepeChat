from PySide6.QtWidgets import QGraphicsBlurEffect

from PySide6.QtGui import QColor
from PySide6.QtWidgets import (QGraphicsDropShadowEffect)

BG_COLOR = 'rgba(30, 27, 19, 1) '
MAIN_BOX_COLOR = 'rgba(255,255,255, 0.1)'

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
