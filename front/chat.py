# -*- coding: utf-8 -*-

################################################################################
## Form generated from reading UI file 'main_window.ui'
##
## Created by: Qt User Interface Compiler version 6.7.1
##
## WARNING! All changes made in this file will be lost when recompiling UI file!
################################################################################

from PySide6.QtCore import (QCoreApplication, QDate, QDateTime, QLocale,
    QMetaObject, QObject, QPoint, QRect,
    QSize, QTime, QUrl, Qt)
from PySide6.QtGui import (QBrush, QColor, QConicalGradient, QCursor,
    QFont, QFontDatabase, QGradient, QIcon,
    QImage, QKeySequence, QLinearGradient, QPainter,
    QPalette, QPixmap, QRadialGradient, QTransform)
from PySide6.QtWidgets import (QApplication, QFrame, QLabel, QLineEdit,
    QMainWindow, QPushButton, QSizePolicy, QWidget)
import res

class Ui_MainWindow(object):
    def setupUi(self, MainWindow):
        if not MainWindow.objectName():
            MainWindow.setObjectName(u"MainWindow")
        MainWindow.resize(700, 500)
        MainWindow.setCursor(QCursor(Qt.ArrowCursor))
        MainWindow.setFocusPolicy(Qt.StrongFocus)
        MainWindow.setWindowOpacity(1.000000000000000)
        MainWindow.setAutoFillBackground(False)
        MainWindow.setWindowFlags(Qt.FramelessWindowHint)
        MainWindow.setAttribute(Qt.WA_TranslucentBackground)
        self.centralwidget = QWidget(MainWindow)
        self.centralwidget.setObjectName(u"centralwidget")
        self.widget = QWidget(self.centralwidget)
        self.widget.setObjectName(u"widget")
        self.widget.setGeometry(QRect(40, 10, 630, 441))
        self.main_bg = QLabel(self.widget)
        self.main_bg.setObjectName(u"main_bg")
        self.main_bg.setGeometry(QRect(0, 29, 620, 411))
        self.main_bg.setStyleSheet(u"background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 rgba(75, 117, 75, 234), stop:1 rgba(59, 128, 111, 239));\n"
"border-bottom-left-radius: 20px;\n"
"border-bottom-right-radius: 20px;")
        self.line = QFrame(self.widget)
        self.line.setObjectName(u"line")
        self.line.setGeometry(QRect(170, 30, 20, 411))
        self.line.setFrameShape(QFrame.Shape.VLine)
        self.line.setFrameShadow(QFrame.Shadow.Sunken)
        self.search = QLineEdit(self.widget)
        self.search.setObjectName(u"search")
        self.search.setGeometry(QRect(0, 90, 181, 40))
        self.search.setStyleSheet(u"border-radius: 2px;\n"
"boreder: none;\n"
"padding-left: 6px;\n"
"font-size: 14px;")
        self.push_messages = QPushButton(self.widget)
        self.push_messages.setObjectName(u"push_messages")
        self.push_messages.setGeometry(QRect(560, 400, 60, 40))
        self.push_messages.setCursor(QCursor(Qt.PointingHandCursor))
        self.push_messages.setStyleSheet(u"QPushButton{\n"
"	background-color: rgb(255, 255, 255);\n"
"	border-bottom-right-radius: 20px;\n"
"}\n"
"QPushButton:hover{\n"
"	background-color: rgba(223, 223, 223, 243);\n"
"}")
        self.message_input = QLineEdit(self.widget)
        self.message_input.setObjectName(u"message_input")
        self.message_input.setGeometry(QRect(180, 400, 381, 40))
        self.message_input.setCursor(QCursor(Qt.IBeamCursor))
        self.message_input.setStyleSheet(u"border-radius: 2px;\n"
"boreder: none;\n"
"padding-left: 6px;\n"
"font-size: 14px;")
        self.left_bg = QLabel(self.widget)
        self.left_bg.setObjectName(u"left_bg")
        self.left_bg.setGeometry(QRect(0, 130, 181, 311))
        self.left_bg.setStyleSheet(u"background-color: qlineargradient(spread:pad, x1:1, y1:0, x2:1, y2:0, stop:0 rgba(0, 0, 0, 32), stop:1 rgba(255, 255, 255, 255));\n"
"border-bottom-left-radius: 20px;")
        self.up_title_chat = QLabel(self.widget)
        self.up_title_chat.setObjectName(u"up_title_chat")
        self.up_title_chat.setGeometry(QRect(180, 30, 380, 60))
        font = QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.up_title_chat.setFont(font)
        self.up_title_chat.setStyleSheet(u"background-color: qlineargradient(spread:pad, x1:1, y1:0, x2:1, y2:0, stop:0 rgba(0, 0, 0, 32), stop:1 rgba(255, 255, 255, 255));\n"
"padding-left: 10px;")
        self.name = QLabel(self.widget)
        self.name.setObjectName(u"name")
        self.name.setGeometry(QRect(60, 40, 111, 41))
        font1 = QFont()
        font1.setPointSize(8)
        font1.setBold(True)
        self.name.setFont(font1)
        self.call = QPushButton(self.widget)
        self.call.setObjectName(u"call")
        self.call.setGeometry(QRect(560, 30, 60, 60))
        font2 = QFont()
        font2.setBold(True)
        self.call.setFont(font2)
        self.call.setCursor(QCursor(Qt.PointingHandCursor))
        self.call.setStyleSheet(u"QPushButton{\n"
"	background-color: rgb(100, 143, 118);\n"
"	border:none;\n"
"	color: rgb(255, 255, 255);\n"
"	image: url(:/background/auricular-phone-symbol-in-a-circle_icon-icons.com_56570.png);\n"
"	padding: 15px;\n"
"}\n"
"QPushButton:hover{	\n"
"	background-color: rgb(127, 200, 158);\n"
"}")
        self.messages = QLabel(self.widget)
        self.messages.setObjectName(u"messages")
        self.messages.setGeometry(QRect(440, 350, 120, 40))
        self.messages.setLayoutDirection(Qt.LeftToRight)
        self.messages.setStyleSheet(u"background-color: rgb(255, 255, 255);\n"
"padding: 10px;\n"
"font-size: 14px;\n"
"border-radius: 15px;")
        self.messages.setAlignment(Qt.AlignRight|Qt.AlignTrailing|Qt.AlignVCenter)
        self.message_avatar = QPushButton(self.widget)
        self.message_avatar.setObjectName(u"message_avatar")
        self.message_avatar.setGeometry(QRect(570, 350, 40, 40))
        self.message_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        self.message_avatar.setStyleSheet(u"border-image: url(:/background/0q2XvMbngZU.jpg);\n"
"border-radius: 20px;\n"
"")
        self.main_avatar = QPushButton(self.widget)
        self.main_avatar.setObjectName(u"main_avatar")
        self.main_avatar.setGeometry(QRect(10, 40, 40, 40))
        self.main_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        self.main_avatar.setStyleSheet(u"border-image: url(:/background/0q2XvMbngZU.jpg);\n"
"border-radius: 20px;\n"
"")
        self.chat_avatar = QPushButton(self.widget)
        self.chat_avatar.setObjectName(u"chat_avatar")
        self.chat_avatar.setGeometry(QRect(10, 142, 40, 40))
        self.chat_avatar.setCursor(QCursor(Qt.PointingHandCursor))
        self.chat_avatar.setStyleSheet(u"border-image: url(:/background/0q2XvMbngZU.jpg);\n"
"border-radius: 20px;\n"
"")
        self.title_chat_left = QLabel(self.widget)
        self.title_chat_left.setObjectName(u"title_chat_left")
        self.title_chat_left.setGeometry(QRect(60, 150, 121, 21))
        font3 = QFont()
        font3.setPointSize(11)
        font3.setBold(True)
        self.title_chat_left.setFont(font3)
        self.title_chat_left.setStyleSheet(u"color: rgb(255, 255, 255);")
        self.chat_box = QPushButton(self.widget)
        self.chat_box.setObjectName(u"chat_box")
        self.chat_box.setGeometry(QRect(0, 130, 181, 60))
        font4 = QFont()
        font4.setPointSize(10)
        self.chat_box.setFont(font4)
        self.chat_box.setCursor(QCursor(Qt.PointingHandCursor))
        self.chat_box.setStyleSheet(u"QPushButton{\n"
"	border-radius: none;\n"
"}\n"
"QPushButton:hover{\n"
"	background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 rgba(0, 0, 0, 14), stop:1 rgba(0, 0, 0, 43));\n"
"}\n"
"\n"
"QPushButton:pressed{\n"
"\n"
"}")
        self.label = QLabel(self.widget)
        self.label.setObjectName(u"label")
        self.label.setGeometry(QRect(0, 10, 620, 24))
        self.label.setStyleSheet(u"background-color: rgb(77, 131, 102);\n"
"background-color: rgb(49, 100, 81);")
        self.close = QPushButton(self.widget)
        self.close.setObjectName(u"close")
        self.close.setGeometry(QRect(580, 10, 40, 24))
        font5 = QFont()
        font5.setPointSize(10)
        font5.setBold(True)
        self.close.setFont(font5)
        self.close.setStyleSheet(u"QPushButton{\n"
"background-color: rgb(82, 162, 129);\n"
"border: none;\n"
"}\n"
"QPushButton:hover{\n"
"	background-color: rgb(203, 0, 0);\n"
"	color: rgb(255, 255, 255);\n"
"}")
        self.roll = QPushButton(self.widget)
        self.roll.setObjectName(u"roll")
        self.roll.setGeometry(QRect(540, 10, 40, 24))
        self.roll.setFont(font5)
        self.roll.setStyleSheet(u"QPushButton{\n"
"background-color: rgb(82, 162, 129);\n"
"border: none;\n"
"}\n"
"QPushButton:hover{\n"
"	\n"
"	background-color: rgb(100, 191, 153);\n"
"	color: rgb(255, 255, 255);\n"
"}")
        MainWindow.setCentralWidget(self.centralwidget)

        self.retranslateUi(MainWindow)

        QMetaObject.connectSlotsByName(MainWindow)
    # setupUi

    def retranslateUi(self, MainWindow):
        MainWindow.setWindowTitle(QCoreApplication.translate("MainWindow", u"PepeChat", None))
        self.main_bg.setText("")
        self.search.setText("")
        self.search.setPlaceholderText(QCoreApplication.translate("MainWindow", u"\u041f\u043e\u0438\u0441\u043a", None))
        self.push_messages.setText(QCoreApplication.translate("MainWindow", u"	--->", None))
        self.message_input.setText("")
        self.message_input.setPlaceholderText(QCoreApplication.translate("MainWindow", u"\u041d\u0430\u043f\u0438\u0441\u0430\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435...", None))
        self.left_bg.setText("")
        self.up_title_chat.setText(QCoreApplication.translate("MainWindow", u"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0447\u0430\u0442\u0430", None))
        self.name.setText(QCoreApplication.translate("MainWindow", u"\u0418\u043c\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", None))
        self.call.setText("")
        self.messages.setText(QCoreApplication.translate("MainWindow", u"egw", None))
        self.message_avatar.setText("")
        self.main_avatar.setText("")
        self.chat_avatar.setText("")
        self.title_chat_left.setText(QCoreApplication.translate("MainWindow", u"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0447\u0430\u0442\u0430", None))
        self.chat_box.setText("")
        self.label.setText("")
        self.close.setText(QCoreApplication.translate("MainWindow", u"X", None))
        self.roll.setText(QCoreApplication.translate("MainWindow", u"_", None))
    # retranslateUi

