import os
import time
import threading
from collections import defaultdict, deque
from typing import Callable, Awaitable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


def _get_client_ip(request: Request) -> str:
    """Best-effort client IP extraction. Honors X-Forwarded-For if present."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # take the first IP in the list
        return xff.split(",")[0].strip()
    client = request.client
    return client.host if client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple sliding-window per-IP rate limiter.

    Environment variables:
    - RATE_LIMIT_WINDOW_SECONDS (int): window size in seconds (default 60)
    - RATE_LIMIT_MAX_REQUESTS (int): max requests allowed per window (default 60)
    - RATE_LIMIT_EXCLUDE_PATHS (str): comma-separated paths to skip (e.g. "/health")
    """

    def __init__(
        self,
        app: Callable,
        window_seconds: int | None = None,
        max_requests: int | None = None,
        exclude_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.window_seconds = int(
            os.getenv("RATE_LIMIT_WINDOW_SECONDS", str(window_seconds or 60))
        )
        self.max_requests = int(
            os.getenv("RATE_LIMIT_MAX_REQUESTS", str(max_requests or 60))
        )
        exclude_env = os.getenv("RATE_LIMIT_EXCLUDE_PATHS", "")
        self.exclude_paths = exclude_paths or []
        if exclude_env:
            self.exclude_paths.extend(
                [p.strip() for p in exclude_env.split(",") if p.strip()]
            )
        # per-IP deque of timestamps
        self._ip_to_timestamps: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        path = request.url.path
        if any(path.startswith(p) for p in self.exclude_paths):
            return await call_next(request)

        now = time.time()
        ip = _get_client_ip(request)

        with self._lock:
            timestamps = self._ip_to_timestamps[ip]
            # drop events outside window
            window_start = now - self.window_seconds
            while timestamps and timestamps[0] < window_start:
                timestamps.popleft()

            remaining = self.max_requests - len(timestamps)
            if remaining <= 0:
                retry_after = (
                    max(1, int(timestamps[0] + self.window_seconds - now))
                    if timestamps
                    else self.window_seconds
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too Many Requests",
                        "rate_limit_window_seconds": self.window_seconds,
                        "rate_limit_max_requests": self.max_requests,
                        "retry_after_seconds": retry_after,
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(now) + retry_after),
                    },
                )

            # allow and record
            timestamps.append(now)
            remaining_after = self.max_requests - len(timestamps)

        response = await call_next(request)
        # annotate response with headers
        response.headers.setdefault("X-RateLimit-Limit", str(self.max_requests))
        response.headers.setdefault(
            "X-RateLimit-Remaining", str(max(0, remaining_after))
        )
        response.headers.setdefault("X-RateLimit-Window", str(self.window_seconds))
        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests with Content-Length larger than the configured limit.

    Note: Only enforces when Content-Length header is present. For extra safety,
    routes should still validate decoded payload sizes after read.

    Environment variables:
    - MAX_UPLOAD_MB (int): maximum allowed megabytes for uploads (default 5)
    - SIZE_LIMIT_PATHS (str): comma-separated paths to enforce on (default "/search")
    """

    def __init__(
        self,
        app: Callable,
        max_upload_mb: int | None = None,
        limit_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", str(max_upload_mb or 5)))
        paths_env = os.getenv("SIZE_LIMIT_PATHS", "")
        self.limit_paths = limit_paths or ["/search"]
        if paths_env:
            self.limit_paths = [p.strip() for p in paths_env.split(",") if p.strip()]
        self._max_bytes = self.max_upload_mb * 1024 * 1024

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        path = request.url.path
        if not any(path.startswith(p) for p in self.limit_paths):
            return await call_next(request)

        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                length = int(content_length)
                if length > self._max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Payload Too Large (>{self.max_upload_mb}MB)",
                            "max_upload_mb": self.max_upload_mb,
                        },
                    )
            except ValueError:
                # ignore malformed header and let route validate after read
                pass

        return await call_next(request)
