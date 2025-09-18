from __future__ import annotations

import logging
import os

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router
from .bootstrap import seed_demo_box
from .metrics import SimulationMetrics
from .queue import SimulationQueueBackend, load_queue_backend
from .trust import load_trust_provider
from .repositories import load_repository
from .store import BoxStore, SimulationStore


def create_app() -> FastAPI:
    allowed_origins = [
        origin.strip()
        for origin in os.environ.get("PLATFORM_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.box_store = BoxStore()
        demo_box = seed_demo_box(app.state.box_store)
        app.state.simulation_store = SimulationStore()
        repository_spec = os.environ.get("SIMULATION_ARTIFACT_REPOSITORY", "filesystem")
        app.state.artifact_repository = load_repository(repository_spec)
        app.state.artifact_repository_name = repository_spec

        workers = int(os.environ.get("SIMULATION_WORKERS", "1"))
        backend_spec = os.environ.get("SIMULATION_QUEUE_BACKEND", "asyncio")
        app.state.metrics = SimulationMetrics()
        trust_spec = os.environ.get("TRUST_PROVIDER", "allowlist")
        app.state.trust_provider = load_trust_provider(trust_spec)

        app.state.simulation_queue = load_queue_backend(
            backend_spec,
            app.state.simulation_store,
            app.state.artifact_repository,
            trust_provider=app.state.trust_provider,
            metrics=app.state.metrics,
            concurrency=workers,
        )
        app.state.queue_backend_name = backend_spec
        app.state.simulation_workers = workers
        app.state.demo_box_id = demo_box.id
        app.state.demo_tenant_id = demo_box.tenant_id

        queue: SimulationQueueBackend = app.state.simulation_queue
        await queue.start()
        try:
            yield
        finally:
            await queue.stop()

    app = FastAPI(title="AP2 Box Platform - Schema Registry", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    embed_secret = os.environ.get("BUDIBASE_EMBED_SECRET")
    if not embed_secret:
        logging.getLogger(__name__).warning(
            "BUDIBASE_EMBED_SECRET not set; using insecure development secret."
        )
        embed_secret = "development-embed-secret"
    app.state.embed_secret = embed_secret

    app.include_router(router)

    return app


app = create_app()
