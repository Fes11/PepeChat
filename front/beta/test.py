from PySide6.QtWidgets import QApplication, QLabel, QVBoxLayout, QWidget

class AdaptiveLabelDemo(QWidget):
    def __init__(self):
        super().__init__()

        # Создаем QLabel
        self.label = QLabel(self)
        
        # Пример длинного текста
        long_text = "Это пример текста, который автоматически изменяет размер QLabel в зависимости от его содержимого. Текст будет автоматически переноситься на новые строки."

        # Устанавливаем текст
        self.label.setText(long_text)

        # Включаем перенос слов
        self.label.setWordWrap(True)

        # Автоматически изменяем размер QLabel в зависимости от текста
        self.label.adjustSize()

        # Устанавливаем макет
        layout = QVBoxLayout()
        layout.addWidget(self.label)
        self.setLayout(layout)

        # Настраиваем параметры окна
        self.setWindowTitle("Адаптивный QLabel")
        self.resize(400, 200)

if __name__ == "__main__":
    app = QApplication([])
    window = AdaptiveLabelDemo()
    window.show()
    app.exec
