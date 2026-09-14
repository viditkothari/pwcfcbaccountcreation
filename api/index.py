"""Vercel serverless entrypoint.

Reuses the existing FastAPI application defined in ``backend/server.py`` (which
already prefixes every route with ``/api``) and exposes it as the ASGI ``app``
that the Vercel Python runtime serves. The ``backend`` directory is bundled via
``includeFiles`` in ``vercel.json``.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from server import app  # noqa: E402,F401  (re-exported for Vercel)
