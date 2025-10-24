# backend/app.py
import uvicorn

# import created app
from server.app import app

if __name__ == "__main__":
    print("[app] Running uvicorn server on http://127.0.0.1:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
