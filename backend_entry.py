import os
import sys
import uvicorn
from icanscan.main import app

if __name__ == "__main__":
    # Support custom port and host arguments from Electron
    host = "127.0.0.1"
    port = 8000
    
    for i, arg in enumerate(sys.argv):
        if arg == "--host" and i + 1 < len(sys.argv):
            host = sys.argv[i + 1]
        elif arg == "--port" and i + 1 < len(sys.argv):
            try:
                port = int(sys.argv[i + 1])
            except ValueError:
                pass
                
    print(f"[Backend Entry] Starting iCanScan FastAPI server standalone on {host}:{port}")
    # Run directly with the app instance to avoid string import lookups when frozen
    uvicorn.run(app, host=host, port=port, log_level="info")
