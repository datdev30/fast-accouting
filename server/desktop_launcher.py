import os
import sys
import threading
import logging
import uvicorn
import webview
from main import app

def start_server(port):
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="error")

class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def select_folder(self):
        if self._window:
            # webview.FOLDER is the modern constant (alias for FileDialog.FOLDER)
            result = self._window.create_file_dialog(webview.FOLDER)
            return result[0] if result else None
        return None

def main():
    port = 8000
    # In a real scenario we might want to find a free port
    
    # Configure logging to file (append mode)
    logging.basicConfig(
        filename='server.log', 
        level=logging.ERROR,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Start FastAPI in a separate thread
    t = threading.Thread(target=start_server, args=(port,))
    t.daemon = True
    t.start()
    
    api = Api()

    # Create window
    window = webview.create_window('FastAccounting', f'http://127.0.0.1:{port}', width=1200, height=800, maximized=True, js_api=api)
    api.set_window(window)
    
    # Start webview (this blocks until window is closed)
    webview.start()
    
    # Force exit to kill uvicorn thread
    os._exit(0)

if __name__ == '__main__':
    main()
