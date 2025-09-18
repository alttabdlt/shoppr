from __future__ import annotations

import asyncio
import json
import logging
from uuid import UUID

import redis.asyncio as redis

from ..jobs import SimulationJob, process_simulation_job
from ..metrics import SimulationMetrics
from ..queue import SimulationQueueBackend
from ..repositories import ArtifactRepository
from ..store import SimulationStore
from ..models import SimulationRequest

logger = logging.getLogger(__name__)


def _serialize(job: SimulationJob) -> str:
    return json.dumps({
        "simulation_id": str(job.simulation_id),
        "payload": job.payload.dict(by_alias=True, exclude_none=True),
    })


def _deserialize(payload: str) -> SimulationJob:
    data = json.loads(payload)
    simulation_id = UUID(data["simulation_id"])
    payload_model = SimulationRequest.parse_obj(data["payload"])
    return SimulationJob(simulation_id=simulation_id, payload=payload_model)


class RedisSimulationQueue(SimulationQueueBackend):
    def __init__(
        self,
        *,
        store: SimulationStore,
        repository: ArtifactRepository,
        trust_provider,
        metrics: SimulationMetrics,
        redis_url: str,
        queue_name: str = "simulation-jobs",
        concurrency: int = 1,
        poll_interval: float = 0.5,
    ) -> None:
        self._store = store
        self._repository = repository
        self._trust_provider = trust_provider
        self._metrics = metrics
        self._redis = redis.from_url(redis_url)
        self._queue_name = queue_name
        self._concurrency = max(1, concurrency)
        self._poll_interval = poll_interval
        self._workers: list[asyncio.Task[None]] = []
        self._running = False

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        for _ in range(self._concurrency):
            self._workers.append(asyncio.create_task(self._worker()))
        logger.info("RedisSimulationQueue listening on %s with %s workers", self._queue_name, self._concurrency)

    async def stop(self) -> None:
        if not self._running:
            return
        self._running = False
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        if self._redis:
            close_fn = getattr(self._redis, "aclose", None)
            if close_fn:
                await close_fn()
            else:  # pragma: no cover - legacy fallback
                await self._redis.close()

    async def enqueue(self, job: SimulationJob) -> None:
        self._metrics.increment_enqueued()
        await self._redis.rpush(self._queue_name, _serialize(job))

    async def _worker(self) -> None:
        while self._running:
            timeout = max(int(self._poll_interval), 1)
            item = await self._redis.blpop(self._queue_name, timeout=timeout)
            if not item:
                await asyncio.sleep(self._poll_interval)
                continue
            _, payload = item
            job = _deserialize(payload.decode("utf-8"))
            await process_simulation_job(
                job,
                self._store,
                self._repository,
                self._trust_provider,
                self._metrics,
            )
