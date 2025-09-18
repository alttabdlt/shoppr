from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from .connectors import CardConnectorError, CardConnectorResult, run_card_payment
from .mandates import build_cart_mandate, build_intent_mandate, build_payment_mandate
from .models import SimulationArtifact, SimulationRequest
from .metrics import SimulationMetrics
from .repositories import ArtifactRepository
from .store import SimulationStore
from .trust import TrustProvider

logger = logging.getLogger(__name__)


@dataclass
class SimulationJob:
    simulation_id: UUID
    payload: SimulationRequest


async def process_simulation_job(
    job: SimulationJob,
    store: SimulationStore,
    repository: ArtifactRepository,
    trust_provider: TrustProvider,
    metrics: SimulationMetrics,
) -> None:
    try:
        payload = job.payload
        payload_dict = payload.dict(by_alias=True, exclude_none=True)

        context = payload_dict.get("context", {})
        merchant_id = context.get("merchantId", "merchant-default")
        agent_id = context.get("agentId", "agent-default")

        trusted = await trust_provider.verify(merchant_id=merchant_id, agent_id=agent_id)

        intent = build_intent_mandate(payload_dict)
        cart = build_cart_mandate(intent, payload_dict)
        payment = build_payment_mandate(intent, cart, payload_dict)

        try:
            connector_result = await run_card_payment(payment)
            metrics.record_connector_success("card")
        except CardConnectorError as exc:
            metrics.record_connector_failure("card")
            raise

        intent_dict = intent.dict()
        cart_dict = cart.dict()
        payment_dict = payment.dict()
        payment_dict["connector"] = connector_result.__dict__

        intent_hash = _hash_payload(intent_dict)
        cart_hash = _hash_payload(cart_dict)
        payment_hash = _hash_payload(payment_dict)

        artifacts = SimulationArtifact(
            intent={"hash": intent_hash, "payload": intent_dict},
            cart={"hash": cart_hash, "payload": cart_dict},
            payment={"hash": payment_hash, "payload": payment_dict},
            metadata={"context": payload.context or {}},
        )
        artifacts.metadata["trust"] = {
            "merchantId": merchant_id,
            "agentId": agent_id,
            "trusted": trusted,
        }

        storage_info = await repository.save(job.simulation_id, artifacts) or {}
        if storage_info:
            artifacts.metadata["storage"] = storage_info

        store.update(
            job.simulation_id,
            status="completed",
            logs=[
                "Generated mandate hashes (stub)",
                f"Artifacts persisted via {storage_info.get('backend', 'unknown')} backend",
            ],
            mandate_hashes={"intent": intent_hash, "cart": cart_hash, "payment": payment_hash},
            artifacts=artifacts,
            error=None,
        )
        metrics.increment_completed(storage_info.get("backend", "unknown"))
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Simulation job %s failed", job.simulation_id)
        store.update(
            job.simulation_id,
            status="failed",
            logs=["Simulation failed", str(exc)],
            mandate_hashes={},
            artifacts=None,
            error=str(exc),
        )
        metrics.increment_failed()


def _hash_payload(payload: object) -> str:
    import hashlib
    import json

    def default(obj: object) -> object:
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, set):
            return list(obj)
        return str(obj)

    serialized = json.dumps(payload, sort_keys=True, default=default).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()
