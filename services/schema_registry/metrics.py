from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class SimulationMetrics:
    enqueued: int = 0
    completed: int = 0
    failed: int = 0
    by_backend: Dict[str, int] = field(default_factory=dict)
    connector_success: Dict[str, int] = field(default_factory=dict)
    connector_failure: Dict[str, int] = field(default_factory=dict)

    def increment_enqueued(self) -> None:
        self.enqueued += 1

    def increment_completed(self, backend: str) -> None:
        self.completed += 1
        self.by_backend[backend] = self.by_backend.get(backend, 0) + 1

    def increment_failed(self) -> None:
        self.failed += 1

    def record_connector_success(self, connector: str) -> None:
        self.connector_success[connector] = self.connector_success.get(connector, 0) + 1

    def record_connector_failure(self, connector: str) -> None:
        self.connector_failure[connector] = self.connector_failure.get(connector, 0) + 1
