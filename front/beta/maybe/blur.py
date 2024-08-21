from PyQt6.QtWidgets import QWidget, QApplication, QVBoxLayout, QPushButton
from PyQt6.QtCore import Qt


import ctypes
from ctypes.wintypes import DWORD, ULONG
from ctypes import windll, c_bool, c_int, POINTER, Structure


class AccentPolicy(Structure):
    _fields_ = [
        ('AccentState', DWORD),
        ('AccentFlags', DWORD),
        ('GradientColor', DWORD),
        ('AnimationId', DWORD),
    ]


class WINCOMPATTRDATA(Structure):
    _fields_ = [
        ('Attribute', DWORD),
        ('Data', POINTER(AccentPolicy)),
        ('SizeOfData', ULONG),
    ]


SetWindowCompositionAttribute = windll.user32.SetWindowCompositionAttribute
SetWindowCompositionAttribute.restype = c_bool
SetWindowCompositionAttribute.argtypes = [c_int, POINTER(WINCOMPATTRDATA)]


class Widget(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_NoSystemBackground)

        accent_policy = AccentPolicy()
        accent_policy.AccentState = 3  # ACCENT_ENABLE_BLURBEHIND;

        win_comp_attr_data = WINCOMPATTRDATA()
        win_comp_attr_data.Attribute = 19  # WCA_ACCENT_POLICY
        win_comp_attr_data.SizeOfData = ctypes.sizeof(accent_policy)
        win_comp_attr_data.Data = ctypes.pointer(accent_policy)

        hwnd = c_int(int(self.winId()))
        ok = SetWindowCompositionAttribute(hwnd, ctypes.pointer(win_comp_attr_data))
        print(ok)

        print(ctypes.get_last_error())

        self.old_pos = None
        self.frame_color = Qt.GlobalColor.darkCyan

        layout = QVBoxLayout()
        layout.addStretch()
        layout.addWidget(QPushButton("Закрыть окно", clicked=self.close))

        self.setLayout(layout)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.old_pos = event.position().toPoint()

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.old_pos = None

    def mouseMoveEvent(self, event):
        if not self.old_pos:
            return

        delta = event.position().toPoint() - self.old_pos
        self.move(self.pos() + delta)


if __name__ == '__main__':
    app = QApplication([])

    w = Widget()
    w.resize(400, 300)
    w.show()

    app.exec()
