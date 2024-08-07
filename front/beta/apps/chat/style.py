BG_COLOR = '#1e1b13'
MAIN_BOX_COLOR = '#262626'

scroll_style = '''QScrollBar:vertical {
    background: rgb(45, 45, 68);
    width: 5px;
    border-radius: 3px;
}

QScrollBar::handle:vertical {
    background-color: rgb(80, 80, 122);
    min-height: 30px;
    border-radius: 3px; /* Закругление краёв */
}

QScrollBar::handle:vertical:hover {
    background-color: #935c9d;
}

QScrollBar::handle:vertical:pressed {
    background-color: #9f63ab;
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

send_btn_style = '''QPushButton {background-color: #9f63ab; border-radius: 10px; padding: 5px;}
                                        QPushButton:hover {background-color: #c67cd5;}'''
