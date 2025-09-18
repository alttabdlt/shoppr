from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class BoxSchemaPayload(BaseModel):
    schema_: Dict[str, Any] = Field(
        default_factory=dict,
        alias="schema",
        description="JSON schema for cart payloads",
    )
    ui: Dict[str, Any] = Field(default_factory=dict, description="UI metadata from Budibase")
    version: str = Field(default="draft", description="Schema version tag")

    class Config:
        allow_population_by_field_name = True

    @property
    def schema(self) -> Dict[str, Any]:
        return self.schema_

    @schema.setter
    def schema(self, value: Dict[str, Any]) -> None:
        self.schema_ = value


class BoxDefinitionDraft(BaseModel):
    name: str
    description: Optional[str] = None
    schema_payload: BoxSchemaPayload = Field(default_factory=BoxSchemaPayload, alias="schema")
    tags: List[str] = Field(default_factory=list)

    class Config:
        allow_population_by_field_name = True

    @property
    def schema(self) -> BoxSchemaPayload:
        return self.schema_payload

    @schema.setter
    def schema(self, value: BoxSchemaPayload) -> None:
        self.schema_payload = value


class BoxRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    state: str = Field(default="draft", description="draft|sandbox|production")
    version: str = Field(default="0.1.0")
    schema_payload: BoxSchemaPayload = Field(default_factory=BoxSchemaPayload, alias="schema")
    tags: List[str] = Field(default_factory=list)
    last_simulation_id: Optional[UUID] = None

    class Config:
        allow_population_by_field_name = True

    @property
    def schema(self) -> BoxSchemaPayload:
        return self.schema_payload

    @schema.setter
    def schema(self, value: BoxSchemaPayload) -> None:
        self.schema_payload = value


class BoxCollection(BaseModel):
    items: List[BoxRecord]


class SchemaUpdateRequest(BaseModel):
    schema_payload: Dict[str, Any] = Field(alias="schema", description="Updated JSON schema")
    ui: Optional[Dict[str, Any]] = Field(default=None, description="Optional UI metadata")
    version: Optional[str] = Field(default=None)

    class Config:
        allow_population_by_field_name = True

    @validator("schema_payload")
    def ensure_object_schema(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        if value.get("type") != "object":
            raise ValueError("schema.type must be 'object'")
        if not isinstance(value.get("properties"), dict):
            raise ValueError("schema.properties must be an object")
        return value

    @validator("ui")
    def ensure_ui_mapping(cls, value: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if value is not None and not isinstance(value, dict):
            raise ValueError("ui must be an object when provided")
        return value

    @property
    def schema(self) -> Dict[str, Any]:
        return self.schema_payload

    @schema.setter
    def schema(self, value: Dict[str, Any]) -> None:
        self.schema_payload = value


class EmbedTokenRequest(BaseModel):
    app_id: Optional[str] = Field(default=None, alias="appId", description="Target Budibase app identifier")
    role: str = Field(default="builder", description="Budibase role for embedded session")
    expires_in_seconds: int = Field(default=900, alias="expiresInSeconds", description="Token lifetime in seconds")


class EmbedTokenResponse(BaseModel):
    token: str
    expires_at: datetime = Field(alias="expiresAt")


class SimulationRequest(BaseModel):
    cart: Dict[str, Any]
    context: Dict[str, Any] = Field(default_factory=dict)
    payment_method: Dict[str, Any] = Field(default_factory=dict, alias="paymentMethod")


class SimulationArtifact(BaseModel):
    intent: Optional[Dict[str, Any]] = None
    cart: Optional[Dict[str, Any]] = None
    payment: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    connector: Optional[Dict[str, Any]] = None


class SimulationRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    box_id: UUID
    status: str = Field(default="queued")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    logs: List[str] = Field(default_factory=list)
    mandate_hashes: Dict[str, str] = Field(default_factory=dict)
    request_payload: Dict[str, Any] = Field(default_factory=dict)
    artifacts: Optional[SimulationArtifact] = None
    error: Optional[str] = None

    def as_request(self) -> SimulationRequest:
        return SimulationRequest.parse_obj(self.request_payload)


class SimulationResponse(BaseModel):
    id: UUID
    status: str
    mandate_hashes: Dict[str, str]
    logs: List[str]
    created_at: datetime
    updated_at: datetime
    error: Optional[str] = None


class SimulationHealthResponse(BaseModel):
    status: str = Field(default="ok")
    queue_backend: str
    artifact_repository: str
    workers: int
    enqueued: int
    completed: int
    failed: int
    completed_by_backend: Dict[str, int] = Field(default_factory=dict)
    connector_success: Dict[str, int] = Field(default_factory=dict)
    connector_failure: Dict[str, int] = Field(default_factory=dict)
