import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class WatchdogHandler(FileSystemEventHandler):
    def __init__(self, script_path):
        super().__init__()
        self.script_path = script_path
        self.process = None
        self.restart_script()

    def on_modified(self, event):
        if event.is_directory:
            return
        print(f"File changed: {event.src_path}")
        self.restart_script()

    def restart_script(self):
        if self.process is not None:
            print("Terminating current script process.")
            self.process.terminate()
            self.process.wait()
        print(f"Starting script: {self.script_path}")
        self.process = subprocess.Popen(["python", self.script_path])

def monitor_directory(directory, script_path):
    event_handler = WatchdogHandler(script_path)
    observer = Observer()
    observer.schedule(event_handler, directory, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("Observer stopped.")
    observer.join()
    
if __name__ == "__main__":
    DIRECTORY_TO_WATCH = "C:/Users/user/Desktop/test/PyQt"
    SCRIPT_TO_RUN = "C:/Users/user/Desktop/test/PyQt/main.py"
    monitor_directory(DIRECTORY_TO_WATCH, SCRIPT_TO_RUN)
