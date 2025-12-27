from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import init_db
from routes import customers, transactions, interest
import os
import sys
from dotenv import load_dotenv

# Load .env from correct path
if getattr(sys, 'frozen', False):
    # If frozen, env is in the same dir as executable
    application_path = os.path.dirname(sys.executable)
    load_dotenv(os.path.join(application_path, ".env"))
else:
    load_dotenv()

app = FastAPI(title="FastAccounting API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    try:
        await init_db()
    except Exception as e:
        # Log critical startup error
        import logging
        logging.error(f"STARTUP ERROR: {e}", exc_info=True)
        # Also write to a standalone file in case logging isn't set up
        with open("startup_error.log", "w") as f:
            f.write(str(e))

@app.exception_handler(500)
async def internal_exception_handler(request, exc):
    import logging
    logging.error(f"Internal Server Error: {exc}", exc_info=True)
    return {"detail": "Internal Server Error. Check server.log."}

@app.get("/")
async def root():
    # Attempt to serve index.html if we are in desktop mode (or if dist exists)
    if getattr(sys, 'frozen', False):
         base_path = sys._MEIPASS
         index_path = os.path.join(base_path, "client", "dist", "index.html")
    else:
         index_path = os.path.join(os.path.dirname(__file__), "..", "client", "dist", "index.html")
         
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Welcome to FastAccounting API (Frontend not found)"}

app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(interest.router, prefix="/api/interest-configs", tags=["Interest Configs"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
from routes import reports, auth
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import sys

# Serve Frontend Static Files
if getattr(sys, 'frozen', False):
    # If running as compiled .exe (PyInstaller)
    # Assets are extracted to sys._MEIPASS/client/dist
    base_path = sys._MEIPASS
    static_dir = os.path.join(base_path, "client", "dist")
else:
    # If running from source
    static_dir = os.path.join(os.path.dirname(__file__), "..", "client", "dist")

if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    # Catch-all for SPA
    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        # Allow API routes to pass through
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        # Check if file exists in root of dist (e.g. vite.svg)
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
             return FileResponse(file_path)
             
        # Otherwise return index.html
        return FileResponse(os.path.join(static_dir, "index.html"))
