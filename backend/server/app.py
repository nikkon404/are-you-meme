# backend/server/app.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import services
from .routes import router


def create_app() -> FastAPI:
    app = FastAPI(title="Are You Meme - Image search")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    # Ensure uploads directory exists and serve it as static files at /uploads
    uploads_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "resources", "uploads"
    )
    uploads_dir = os.path.abspath(uploads_dir)
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

    @app.on_event("startup")
    def startup():
        print("[server.app] startup event: initializing services")
        services.init()  # uses device auto-detection

    return app


app = create_app()
