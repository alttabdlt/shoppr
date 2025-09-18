from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List
from uuid import uuid4

from pydantic import BaseModel, Field


class IntentMandate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    description: str
    constraints: Dict[str, Any]
    expires_at: datetime


class CartItem(BaseModel):
    sku: str = Field(default="unknown")
    quantity: int = Field(default=1)
    unit_price: Decimal = Field(default=Decimal("0"))
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CartMandate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    intent_id: str
    items: List[CartItem]
    currency: str
    totals: Dict[str, Decimal]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PaymentMandate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    intent_id: str
    cart_id: str
    method: Dict[str, Any]
    amount: Decimal
    requested_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


def build_intent_mandate(payload: Dict[str, Any]) -> IntentMandate:
    context = payload.get("context", {})
    description = context.get("description") or "AP2 sandbox purchase"
    ttl_seconds = context.get("ttlSeconds", 3600)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    constraints = {
        "priceCap": context.get("priceCap"),
        "allowedSuppliers": context.get("suppliers"),
        "ttlSeconds": ttl_seconds,
    }
    return IntentMandate(description=description, constraints=constraints, expires_at=expires_at)


def build_cart_mandate(intent: IntentMandate, payload: Dict[str, Any]) -> CartMandate:
    cart_payload = payload.get("cart", {})
    items_input = cart_payload.get("items", [])
    if not isinstance(items_input, list):
        items_input = []

    items = []
    for raw in items_input:
        item = raw if isinstance(raw, dict) else {}
        items.append(
            CartItem(
                sku=item.get("sku", "unknown"),
                quantity=int(item.get("quantity", 1)),
                unit_price=Decimal(str(item.get("unitPrice", "0"))),
                metadata={k: v for k, v in item.items() if k not in {"sku", "quantity", "unitPrice"}},
            )
        )
    if not items:
        items = [CartItem()]

    currency = cart_payload.get("currency", "USD")
    total_amount = sum(item.unit_price * item.quantity for item in items)
    totals = {"total": total_amount.quantize(Decimal("0.01"))}
    metadata = {k: v for k, v in cart_payload.items() if k not in {"items", "currency"}}

    return CartMandate(
        intent_id=intent.id,
        items=items,
        currency=currency,
        totals=totals,
        metadata=metadata,
    )


def build_payment_mandate(intent: IntentMandate, cart: CartMandate, payload: Dict[str, Any]) -> PaymentMandate:
    method = payload.get("payment_method", {})
    amount = cart.totals.get("total", Decimal("0"))
    return PaymentMandate(
        intent_id=intent.id,
        cart_id=cart.id,
        method=method,
        amount=amount,
        requested_at=datetime.now(timezone.utc),
        metadata={"context": payload.get("context", {})},
    )
