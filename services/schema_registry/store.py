from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Iterable, Optional
from uuid import UUID

from .models import (
    BoxDefinitionDraft,
    BoxRecord,
    SchemaUpdateRequest,
    SimulationArtifact,
    SimulationRecord,
    SimulationRequest,
)


class BoxStore:
    def __init__(self) -> None:
        self._records: Dict[UUID, BoxRecord] = {}

    def create(self, tenant_id: UUID, draft: BoxDefinitionDraft) -> BoxRecord:
        record = BoxRecord(
            tenant_id=tenant_id,
            name=draft.name,
            description=draft.description,
            schema=draft.schema,
            tags=draft.tags,
        )
        self._records[record.id] = record
        return record

    def set_last_simulation(self, box_id: UUID, simulation_id: UUID) -> BoxRecord:
        record = self._records[box_id]
        record.last_simulation_id = simulation_id
        record.updated_at = datetime.now(timezone.utc)
        self._records[box_id] = record
        return record

    def list(self, *, tenant_id: Optional[UUID] = None, state: Optional[str] = None) -> Iterable[BoxRecord]:
        for record in self._records.values():
            if tenant_id and record.tenant_id != tenant_id:
                continue
            if state and record.state != state:
                continue
            yield record

    def get(self, box_id: UUID) -> BoxRecord:
        return self._records[box_id]

    def update_schema(self, box_id: UUID, payload: SchemaUpdateRequest) -> BoxRecord:
        record = self._records[box_id]
        new_schema = record.schema.copy(deep=True)
        new_schema.schema = payload.schema
        if payload.ui is not None:
            new_schema.ui = payload.ui
        if payload.version:
            new_schema.version = payload.version
        record.schema = new_schema
        record.updated_at = datetime.now(timezone.utc)
        self._records[box_id] = record
        return record


class SimulationStore:
    def __init__(self) -> None:
        self._records: Dict[UUID, SimulationRecord] = {}

    def create(self, box_id: UUID, payload: SimulationRequest) -> SimulationRecord:
        record = SimulationRecord(
            box_id=box_id,
            status="queued",
            request_payload=payload.dict(by_alias=True, exclude_none=True),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._records[record.id] = record
        return record

    def update(self, simulation_id: UUID, **kwargs) -> SimulationRecord:
        record = self._records[simulation_id]
        for key, value in kwargs.items():
            if key == "artifacts" and value is not None and not isinstance(value, SimulationArtifact):
                value = SimulationArtifact(**value)
            setattr(record, key, value)
        record.updated_at = datetime.now(timezone.utc)
        self._records[simulation_id] = record
        return record

    def get(self, simulation_id: UUID) -> SimulationRecord:
        return self._records[simulation_id]
