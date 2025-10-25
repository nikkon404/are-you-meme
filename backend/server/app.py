# backend/server/app.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from . import services
from .routes import router
from .middleware import RateLimitMiddleware, BodySizeLimitMiddleware


def create_app() -> FastAPI:
    app = FastAPI(title="Are You Meme - Image search")

    # Configure Trusted Hosts
    allowed_hosts = os.getenv("TRUSTED_HOSTS", "").split(",")
    allowed_hosts = [h.strip() for h in allowed_hosts if h.strip()]
    # In dev, default to allowing localhost
    if not allowed_hosts:
        allowed_hosts = ["localhost", "127.0.0.1", "::1"]
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # Configure strict CORS
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins = [o.strip() for o in allowed_origins if o.strip()]
    if not allowed_origins:
        # Default dev origin for Vite
        allowed_origins = ["http://localhost:5173"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["POST", "GET", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "X-Turnstile-Token",
            "X-HCaptcha-Token",
        ],
        max_age=600,
    )

    # Rate limiting and body size limits
    app.add_middleware(RateLimitMiddleware, exclude_paths=["/health", "/memes"])
    app.add_middleware(BodySizeLimitMiddleware)

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
