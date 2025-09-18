from __future__ import annotations

import logging
import os
from typing import Optional
from uuid import UUID, uuid5

from .models import BoxDefinitionDraft, BoxRecord, BoxSchemaPayload
from .store import BoxStore

LOGGER = logging.getLogger(__name__)

DEFAULT_TENANT_NAMESPACE = UUID("c2b969ce-8a5e-4a2f-8f91-e8d16f0a4d2f")
FALLBACK_TENANT_SLUG = "team:fallback"


def _resolve_namespace(namespace: Optional[str]) -> UUID:
    if namespace:
        try:
            return UUID(namespace)
        except ValueError:
            LOGGER.warning(
                "Invalid PLATFORM_TENANT_NAMESPACE_UUID '%s'; falling back to default namespace", namespace
            )
    return DEFAULT_TENANT_NAMESPACE


def seed_demo_box(store: BoxStore) -> BoxRecord:
    """Ensure a demo box exists for the fallback tenant used by the portal."""

    namespace = _resolve_namespace(os.environ.get("PLATFORM_TENANT_NAMESPACE_UUID"))
    tenant_id = uuid5(namespace, FALLBACK_TENANT_SLUG)

    existing = next(iter(store.list(tenant_id=tenant_id)), None)
    if existing:
        return existing

    schema_payload = BoxSchemaPayload(
        schema={
        "title": "Demo Cart Mandate",
        "type": "object",
        "properties": {
            "cartId": {
                "title": "Cart ID",
                "type": "string",
                "description": "Reference identifier for the shopper's cart",
            },
            "currency": {
                "title": "Currency",
                "type": "string",
                "enum": ["USD", "EUR", "GBP"],
                "default": "USD",
            },
            "total": {
                "title": "Order Total",
                "type": "number",
                "minimum": 0,
            },
            "lineItems": {
                "title": "Line Items",
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "sku": {"type": "string", "title": "SKU"},
                        "name": {"type": "string", "title": "Name"},
                        "quantity": {"type": "integer", "title": "Qty", "minimum": 1},
                        "unitPrice": {"type": "number", "title": "Unit Price", "minimum": 0},
                    },
                    "required": ["sku", "quantity", "unitPrice"],
                },
            },
            "policies": {
                "title": "Policy Flags",
                "type": "object",
                "properties": {
                    "fraudCheck": {"type": "boolean", "title": "Fraud Check"},
                    "manualReview": {"type": "boolean", "title": "Manual Review"},
                    "allowBackorder": {"type": "boolean", "title": "Allow Backorder"},
                },
            },
        },
        "required": ["cartId", "currency", "lineItems"],
        },
        ui={
            "layout": [
                {"type": "row", "fields": ["cartId", "currency", "total"]},
                {"type": "section", "title": "Line Items", "fields": ["lineItems"]},
                {"type": "section", "title": "Policies", "fields": ["policies"]},
            ]
        },
        version="v0",
    )
    draft = BoxDefinitionDraft(
        name="Demo Checkout Box",
        description="Pre-seeded box for Budibase designer demos and smoke tests.",
        tags=["demo", "budibase"],
        schema_payload=schema_payload,
    )

    record = store.create(tenant_id=tenant_id, draft=draft)
    LOGGER.info(
        "Seeded demo box %s for fallback tenant %s using namespace %s",
        record.id,
        tenant_id,
        namespace,
    )
    return record
