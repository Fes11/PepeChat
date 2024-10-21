from apps.chat.style import MAIN_BOX_COLOR
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (QVBoxLayout, QWidget, QPushButton)


class DialogWindow(QPushButton):
    '''Базовый класс модальных окон. '''
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setVisible(False)
        
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(0,0,0,0)
        main_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.background = QPushButton()
        self.background.clicked.connect(self.close)
        self.background.setStyleSheet('background: rgba(0, 0, 0, 0.5); border: none; border-radius:10px;')
        
        self.main_widget = QWidget()
        self.main_widget.setFixedSize(400, 500)
        self.main_widget.setStyleSheet(f'''QWidget {{background: rgba(0,0,0,0.9); color: white; border-radius: 10px; font-size: 13px;}}
                                            QTextEdit {{background: {MAIN_BOX_COLOR}; padding-top: 7px; padding-left: 8px; font-weight: bold;}}
                                            QLabel {{background: rgba(0,0,0,0); font-weight: bold; font-size: 13px;}}
                                            QPushButton {{background: {MAIN_BOX_COLOR}; font-weight: bold;}}
                                            QPushButton:hover {{background: rgba(255,255,255, 0.3);}}''')
        main_layout.addWidget(self.main_widget)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0,0,0,0)
        layout.addWidget(self.background)

        layout.addLayout(main_layout)
        self.setLayout(layout)
    
    def close(self):
        self.setVisible(False)
    
    def resizeEvent(self, event):
        self.background.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)
