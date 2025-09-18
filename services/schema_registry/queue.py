from __future__ import annotations

import asyncio
import importlib
import logging
import os
from abc import ABC, abstractmethod
from typing import Optional, Type

from .jobs import SimulationJob, process_simulation_job
from .metrics import SimulationMetrics
from .repositories import ArtifactRepository
from .trust import TrustProvider
from .store import SimulationStore

logger = logging.getLogger(__name__)


class SimulationQueueBackend(ABC):
    @abstractmethod
    async def start(self) -> None:  # pragma: no cover - interface
        ...

    @abstractmethod
    async def stop(self) -> None:  # pragma: no cover - interface
        ...

    @abstractmethod
    async def enqueue(self, job: SimulationJob) -> None:  # pragma: no cover - interface
        ...


class AsyncioSimulationQueue(SimulationQueueBackend):
    def __init__(
        self,
        store: SimulationStore,
        repository: ArtifactRepository,
        trust_provider: TrustProvider,
        metrics: SimulationMetrics,
        *,
        concurrency: int = 1,
    ) -> None:
        self._store = store
        self._repository = repository
        self._trust_provider = trust_provider
        self._metrics = metrics
        self._queue: asyncio.Queue[Optional[SimulationJob]] = asyncio.Queue()
        self._workers: list[asyncio.Task[None]] = []
        self._concurrency = max(1, concurrency)
        self._running = False

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        for _ in range(self._concurrency):
            self._workers.append(asyncio.create_task(self._worker()))
        logger.info("AsyncioSimulationQueue started with %s workers", self._concurrency)

    async def stop(self) -> None:
        if not self._running:
            return
        self._running = False
        for _ in self._workers:
            await self._queue.put(None)
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        logger.info("AsyncioSimulationQueue stopped")

    async def enqueue(self, job: SimulationJob) -> None:
        self._metrics.increment_enqueued()
        await self._queue.put(job)

    async def _worker(self) -> None:
        while True:
            job = await self._queue.get()
            if job is None:
                self._queue.task_done()
                break
            try:
                await process_simulation_job(
                    job,
                    self._store,
                    self._repository,
                    self._trust_provider,
                    self._metrics,
                )
            finally:
                self._queue.task_done()


def load_queue_backend(
    dotted_path: str,
    store: SimulationStore,
    repository: ArtifactRepository,
    trust_provider: TrustProvider,
    *,
    concurrency: int,
    metrics: SimulationMetrics,
) -> SimulationQueueBackend:
    if dotted_path == "asyncio":
        return AsyncioSimulationQueue(
            store,
            repository,
            trust_provider,
            metrics=metrics,
            concurrency=concurrency,
        )
    if dotted_path == "redis":
        from .queue_backends.redis import RedisSimulationQueue

        redis_url = os.environ["SIMULATION_REDIS_URL"]
        queue_name = os.environ.get("SIMULATION_QUEUE_NAME", "simulation-jobs")
        poll_interval = float(os.environ.get("SIMULATION_QUEUE_POLL_INTERVAL", "0.5"))
        return RedisSimulationQueue(
            store=store,
            repository=repository,
            trust_provider=trust_provider,
            metrics=metrics,
            redis_url=redis_url,
            queue_name=queue_name,
            concurrency=concurrency,
            poll_interval=poll_interval,
        )

    module_path, _, attr = dotted_path.rpartition(".")
    if not module_path:
        raise ValueError("SIMULATION_QUEUE_BACKEND must be 'asyncio' or a dotted path")

    module = importlib.import_module(module_path)
    backend_cls: Type[SimulationQueueBackend] = getattr(module, attr)  # type: ignore[assignment]
    return backend_cls(
        store=store,
        repository=repository,
        trust_provider=trust_provider,
        metrics=metrics,
        concurrency=concurrency,
    )  # type: ignore[arg-type]
