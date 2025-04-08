from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLineEdit, QListWidget, QListWidgetItem
from PySide6.QtCore import Qt, QPoint
from PySide6.QtGui import QCursor
import sys

class SearchList(QListWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        # Убираем Popup, но ставим флаг, чтобы виджет был поверх других
        self.setWindowFlags(Qt.ToolTip)
        self.setFocusPolicy(Qt.NoFocus)  # Убираем фокус с QListWidget
        self.setSelectionMode(QListWidget.SingleSelection)
        self.itemClicked.connect(self.select_item)
        self.hide()

    def show_with_position(self, pos):
        """Отображает список на заданной позиции."""
        self.move(pos)
        self.show()

    def select_item(self, item):
        """Обработка выбора элемента из выпадающего списка."""
        self.parent().search_input.setText(item.text())
        self.hide()
        self.parent().search_input.setFocus()  # Возвращаем фокус на поле ввода
    

class UsernameSearchWidget(QWidget):
    def __init__(self):
        super().__init__()

        # Инициализация интерфейса
        self.setWindowFlags(Qt.Popup)
        self.setWindowTitle("Поиск по никнеймам")
        self.resize(300, 50)

        # Создаем виджеты
        self.layout = QVBoxLayout(self)
        self.search_input = QLineEdit(self)
        self.search_input.setPlaceholderText("Search...")
        self.search_input.setStyleSheet('''background-color: rgba(0,0,0,0); padding-top: 2px; font-weight: bold;''')
        
        # Загрузка никнеймов из файла
        self.usernames = self.load_usernames("usernames.txt")

        # Создаем выпадающий список
        self.dropdown_list = SearchList(self)
        self.dropdown_list.setCursor(QCursor(Qt.PointingHandCursor))
        self.dropdown_list.setStyleSheet('''padding: 12px; font-size: 16px; color: rgba(255,255,255, 0.8);''')
        self.dropdown_list.setFixedWidth(220)
        self.dropdown_list.hide()

        # Подключаем сигнал для обновления списка
        self.search_input.textChanged.connect(self.update_results)
        self.search_input.editingFinished.connect(self.hide_dropdown)

        # Добавляем виджеты на форму
        self.layout.addWidget(self.search_input)

    def load_usernames(self, filename):
        try:
            with open(filename, 'r') as file:
                usernames = [line.strip() for line in file.readlines()]
            return usernames
        except FileNotFoundError:
            print(f"Файл {filename} не найден.")
            return []

    def update_results(self):
        search_text = self.search_input.text().lower()
        self.dropdown_list.clear()

        if search_text:
            filtered_usernames = [name for name in self.usernames if search_text in name.lower()]

            # Обновляем содержимое выпадающего списка
            for name in filtered_usernames:
                item = QListWidgetItem(name)
                self.dropdown_list.addItem(item)

            # Показываем выпадающий список
            if filtered_usernames:
                dropdown_pos = self.search_input.mapToGlobal(QPoint(-35, self.search_input.height()))
                self.dropdown_list.show_with_position(dropdown_pos)
            else:
                self.dropdown_list.hide()
        else:
            self.dropdown_list.hide()

    def hide_dropdown(self):
        """Скрываем выпадающий список, когда поле ввода теряет фокус."""
        self.dropdown_list.hide()
