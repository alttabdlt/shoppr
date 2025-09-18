import asyncio
from uuid import uuid4

import pytest

from schema_registry.jobs import SimulationJob
from schema_registry.models import SimulationRequest
from schema_registry.metrics import SimulationMetrics
from schema_registry.queue import AsyncioSimulationQueue
from schema_registry.trust import AllowlistTrustProvider
from schema_registry.repositories import MemoryArtifactRepository
from schema_registry.store import SimulationStore


@pytest.mark.asyncio
async def test_asyncio_queue_processes_job():
    store = SimulationStore()
    repository = MemoryArtifactRepository()
    metrics = SimulationMetrics()
    trust = AllowlistTrustProvider({"merchant-default"}, {"agent-default"})
    queue = AsyncioSimulationQueue(
        store=store,
        repository=repository,
        trust_provider=trust,
        metrics=metrics,
        concurrency=1,
    )

    payload = SimulationRequest(
        cart={"items": [{"sku": "sku-1", "quantity": 2, "unitPrice": "12.50"}]},
        context={"merchantId": "merchant-default", "agentId": "agent-default"},
        payment_method={"last4": "4242"},
    )
    record = store.create(box_id=uuid4(), payload=payload)

    await queue.start()
    await queue.enqueue(SimulationJob(simulation_id=record.id, payload=payload))

    async def _wait():
        for _ in range(20):
            await asyncio.sleep(0.05)
            if store.get(record.id).status == "completed":
                return True
        return False

    assert await _wait(), "simulation did not complete in time"
    processed = store.get(record.id)
    assert processed.status == "completed"
    assert processed.artifacts is not None
    assert processed.mandate_hashes["intent"]
    assert processed.artifacts.intent["payload"]["id"]
    assert processed.artifacts.payment["payload"]["connector"]["status"] in {"authorized", "requires_step_up"}
    assert processed.artifacts.metadata["trust"]["trusted"] is True
    assert metrics.completed == 1
    assert metrics.enqueued == 1

    await queue.stop()


@pytest.mark.asyncio
async def test_redis_queue_processes_job(monkeypatch):
    fakeredis = pytest.importorskip("fakeredis")

    fake = fakeredis.aioredis.FakeRedis(decode_responses=False)

    import redis.asyncio as redis_async

    monkeypatch.setattr(redis_async, "from_url", lambda url: fake)

    from schema_registry.queue_backends.redis import RedisSimulationQueue
    from schema_registry.repositories import MemoryArtifactRepository

    store = SimulationStore()
    repository = MemoryArtifactRepository()
    metrics = SimulationMetrics()
    queue = RedisSimulationQueue(
        store=store,
        repository=repository,
        trust_provider=AllowlistTrustProvider({"merchant-default"}, {"agent-default"}),
        metrics=metrics,
        redis_url="redis://localhost:6379/0",
        queue_name="test-sim-jobs",
        concurrency=1,
        poll_interval=0.1,
    )

    payload = SimulationRequest(
        cart={"items": [{"sku": "sku-redis", "quantity": 1, "unitPrice": "9.99"}]},
        context={"merchantId": "merchant-default", "agentId": "agent-default"},
        payment_method={}
    )
    record = store.create(box_id=uuid4(), payload=payload)

    await queue.start()
    await queue.enqueue(SimulationJob(simulation_id=record.id, payload=payload))

    async def _wait():
        for _ in range(40):
            await asyncio.sleep(0.05)
            if store.get(record.id).status == "completed":
                return True
        return False

    assert await _wait(), "redis-backed simulation did not complete"
    processed = store.get(record.id)
    assert processed.status == "completed"
    assert processed.artifacts is not None
    assert processed.mandate_hashes["intent"]
    assert metrics.completed == 1
    assert metrics.enqueued == 1
    assert metrics.connector_success.get("card") == 1
    assert processed.artifacts.metadata["trust"]["trusted"] is True

    await queue.stop()
    await fake.flushdb()
    close_fn = getattr(fake, "aclose", None)
    if close_fn:
        await close_fn()
    else:
        await fake.close()
