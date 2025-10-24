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

    # Mount directories for meme images
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    resources_dir = os.path.join(backend_dir, "resources")

    # Mount memes directory
    memes_dir = os.path.join(resources_dir, "memes")
    memes_dir = os.path.abspath(memes_dir)
    if not os.path.exists(memes_dir):
        print(f"[server.app] Warning: Memes directory does not exist: {memes_dir}")
    else:
        app.mount("/memes", StaticFiles(directory=memes_dir), name="memes")

    @app.on_event("startup")
    def startup():
        print("[server.app] startup event: initializing services")
        services.init()  # uses device auto-detection

    return app


app = create_app()
