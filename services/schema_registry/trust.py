from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class TrustProvider(Protocol):
    async def verify(self, *, merchant_id: str, agent_id: str) -> bool:
        ...


@dataclass
class AllowlistTrustProvider:
    allowed_merchants: set[str]
    allowed_agents: set[str]

    async def verify(self, *, merchant_id: str, agent_id: str) -> bool:
        return merchant_id in self.allowed_merchants and agent_id in self.allowed_agents


@dataclass
class MockDidTrustProvider:
    prefix: str = "did:web:trust.example/"

    async def verify(self, *, merchant_id: str, agent_id: str) -> bool:
        return merchant_id.startswith(self.prefix) and agent_id.startswith(self.prefix)


def load_trust_provider(spec: str | None) -> TrustProvider:
    if not spec or spec == "allowlist":
        return AllowlistTrustProvider(
            allowed_merchants={"merchant-default"},
            allowed_agents={"agent-default"},
        )
    if spec == "did:mock":
        return MockDidTrustProvider()

    module_path, _, attr = spec.rpartition(".")
    if not module_path:
        raise ValueError("TRUST_PROVIDER must be 'allowlist', 'did:mock', or dotted path")

    module = __import__(module_path, fromlist=[attr])
    provider_cls = getattr(module, attr)
    return provider_cls()

