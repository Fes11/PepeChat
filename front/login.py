# -*- coding: utf-8 -*-

################################################################################
## Form generated from reading UI file 'login.ui'
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
from PySide6.QtWidgets import (QApplication, QDialog, QLabel, QLineEdit,
    QPushButton, QSizePolicy, QWidget)

class Ui_Login(object):
    def setupUi(self, Login):
        if not Login.objectName():
            Login.setObjectName(u"Login")
        Login.resize(400, 496)
        self.bg = QLabel(Login)
        self.bg.setObjectName(u"bg")
        self.bg.setGeometry(QRect(56, 30, 300, 420))
        self.bg.setStyleSheet(u"background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 rgba(75, 117, 75, 200), stop:1 rgba(59, 128, 111, 205));\n"
"border-radius: 20px;")
        self.title = QLabel(Login)
        self.title.setObjectName(u"title")
        self.title.setGeometry(QRect(60, 60, 291, 51))
        font = QFont()
        font.setPointSize(22)
        font.setBold(True)
        self.title.setFont(font)
        self.title.setStyleSheet(u"color: rgb(255, 255, 255);")
        self.title.setAlignment(Qt.AlignCenter)
        self.login = QLineEdit(Login)
        self.login.setObjectName(u"login")
        self.login.setGeometry(QRect(100, 160, 210, 40))
        font1 = QFont()
        font1.setPointSize(10)
        self.login.setFont(font1)
        self.login.setStyleSheet(u"padding-left: 10px;\n"
"border-radius: 10px;")
        self.login_2 = QPushButton(Login)
        self.login_2.setObjectName(u"login_2")
        self.login_2.setGeometry(QRect(100, 320, 210, 40))
        font2 = QFont()
        font2.setPointSize(13)
        font2.setBold(True)
        self.login_2.setFont(font2)
        self.login_2.setCursor(QCursor(Qt.PointingHandCursor))
        self.login_2.setStyleSheet(u"QPushButton{\n"
"	border-radius: 10px;\n"
"	color: rgb(102, 102, 102);\n"
"	background-color: rgb(255, 255, 255);\n"
"	transition: all 1s ease-in-out;\n"
"}\n"
"QPushButton:hover{	\n"
"	background-color: rgb(225, 225, 225);\n"
"}")
        self.password = QLineEdit(Login)
        self.password.setObjectName(u"password")
        self.password.setGeometry(QRect(100, 220, 210, 40))
        self.password.setFont(font1)
        self.password.setCursor(QCursor(Qt.IBeamCursor))
        self.password.setStyleSheet(u"padding-left: 10px;\n"
"border-radius: 10px;")
        self.password.setEchoMode(QLineEdit.Password)
        self.label_3 = QLabel(Login)
        self.label_3.setObjectName(u"label_3")
        self.label_3.setGeometry(QRect(80, 370, 101, 20))
        font3 = QFont()
        font3.setPointSize(10)
        font3.setBold(True)
        self.label_3.setFont(font3)
        self.label_3.setCursor(QCursor(Qt.PointingHandCursor))
        self.label_3.setStyleSheet(u"QLabel{\n"
"	color: rgb(255, 255, 255);\n"
"}\n"
"QLabel:hover{	\n"
"	\n"
"	color: rgb(207, 207, 207);\n"
"}")
        self.label_3.setAlignment(Qt.AlignCenter)
        self.lose_pass = QLabel(Login)
        self.lose_pass.setObjectName(u"lose_pass")
        self.lose_pass.setGeometry(QRect(180, 370, 151, 20))
        self.lose_pass.setFont(font3)
        self.lose_pass.setCursor(QCursor(Qt.PointingHandCursor))
        self.lose_pass.setStyleSheet(u"QLabel{\n"
"	color: rgb(255, 255, 255);\n"
"}\n"
"QLabel:hover{	\n"
"	\n"
"	color: rgb(207, 207, 207);\n"
"}")
        self.lose_pass.setAlignment(Qt.AlignCenter)

        self.retranslateUi(Login)

        QMetaObject.connectSlotsByName(Login)
    # setupUi

    def retranslateUi(self, Login):
        Login.setWindowTitle(QCoreApplication.translate("Login", u"Log In", None))
        self.bg.setText("")
        self.title.setText(QCoreApplication.translate("Login", u"\u0410\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044f", None))
        self.login.setPlaceholderText(QCoreApplication.translate("Login", u"Username...", None))
        self.login_2.setText(QCoreApplication.translate("Login", u"\u0412\u043e\u0439\u0442\u0438", None))
        self.password.setText("")
        self.password.setPlaceholderText(QCoreApplication.translate("Login", u"Password...", None))
        self.label_3.setText(QCoreApplication.translate("Login", u"\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f", None))
        self.lose_pass.setText(QCoreApplication.translate("Login", u"\u0415\u0441\u043b\u0438 \u0437\u0430\u0431\u044b\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c", None))
    # retranslateUi

