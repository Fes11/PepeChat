import win32gui
import time

def get_active_window_title():
    hwnd = win32gui.GetForegroundWindow()  # Получаем дескриптор активного окна
    if hwnd:
        return win32gui.GetWindowText(hwnd)
    return None

def monitor_taskbar_clicks():
    last_window_title = None

    while True:
        # Получаем заголовок текущего активного окна
        current_window_title = get_active_window_title()

        # Если активное окно изменилось
        if current_window_title != last_window_title:
            if current_window_title:
                print(f"Активное окно: {current_window_title}")
            last_window_title = current_window_title

        time.sleep(0.5)  # Задержка для снижения нагрузки на CPU

monitor_taskbar_clicks()
