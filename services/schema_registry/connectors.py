from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict
from uuid import uuid4

from .mandates import PaymentMandate


@dataclass
class CardConnectorResult:
    status: str
    processor_reference: str
    payload: Dict[str, Any]


class CardConnectorError(RuntimeError):
    pass


async def run_card_payment(mandate: PaymentMandate) -> CardConnectorResult:
    """Simulate a card payment connector.

    Applies simple failure heuristics for testing: if the payment metadata includes
    `"simulateFailure": true` or the amount is negative, a CardConnectorError is raised.
    """

    payload = mandate.method or {}
    if payload.get("simulateDelay"):
        await asyncio.sleep(float(payload.get("simulateDelay")) / 1000.0)

    if payload.get("simulateFailure") or mandate.amount < 0:
        raise CardConnectorError("Simulated connector failure")

    status = "requires_step_up" if payload.get("requireStepUp") else "authorized"

    processor_payload = {
        "cardLast4": payload.get("last4", "4242"),
        "amount": str(mandate.amount),
        "currency": mandate.metadata.get("context", {}).get("currency", "USD"),
    }

    return CardConnectorResult(
        status=status,
        processor_reference=str(uuid4()),
        payload=processor_payload,
    )

