from uuid import UUID, uuid5

from schema_registry.bootstrap import (
    DEFAULT_TENANT_NAMESPACE,
    FALLBACK_TENANT_SLUG,
    seed_demo_box,
)
from schema_registry.store import BoxStore


def test_seed_demo_box_uses_fallback_namespace(monkeypatch):
    monkeypatch.delenv("PLATFORM_TENANT_NAMESPACE_UUID", raising=False)
    store = BoxStore()

    record = seed_demo_box(store)

    assert record.tenant_id == uuid5(DEFAULT_TENANT_NAMESPACE, FALLBACK_TENANT_SLUG)
    schema = record.schema.schema
    assert schema.get("type") == "object"
    assert set(schema.get("required", [])) >= {"cartId", "currency", "lineItems"}
    assert len(list(store.list())) == 1


def test_seed_demo_box_is_idempotent(monkeypatch):
    namespace = UUID("2f9c7e85-9de1-4a2d-9af6-5f57f2c3f6b1")
    monkeypatch.setenv("PLATFORM_TENANT_NAMESPACE_UUID", str(namespace))
    store = BoxStore()

    first = seed_demo_box(store)
    second = seed_demo_box(store)

    assert first.id == second.id
    expected_tenant = uuid5(namespace, FALLBACK_TENANT_SLUG)
    assert first.tenant_id == expected_tenant
    assert len(list(store.list())) == 1
