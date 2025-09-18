from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from .jobs import SimulationJob
from .queue import SimulationQueueBackend
from .models import (
    BoxCollection,
    BoxDefinitionDraft,
    BoxRecord,
    EmbedTokenRequest,
    EmbedTokenResponse,
    SchemaUpdateRequest,
    SimulationArtifact,
    SimulationHealthResponse,
    SimulationRequest,
    SimulationResponse,
)
from .security import build_embed_token
from .store import BoxStore, SimulationStore

router = APIRouter(prefix="/v1", tags=["boxes"])


def get_box_store(request: Request) -> BoxStore:
    return request.app.state.box_store  # type: ignore[attr-defined]


def get_simulation_store(request: Request) -> SimulationStore:
    return request.app.state.simulation_store  # type: ignore[attr-defined]


def get_embed_secret(request: Request) -> str:
    secret = getattr(request.app.state, "embed_secret", None)
    if not secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Embed secret misconfigured")
    return secret


def get_simulation_queue(request: Request) -> SimulationQueueBackend:
    queue = getattr(request.app.state, "simulation_queue", None)
    if not queue:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Simulation queue unavailable")
    return queue


def resolve_tenant(x_tenant_id: Optional[str] = Header(default=None)) -> UUID:
    if not x_tenant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing X-Tenant-ID header")
    try:
        return UUID(x_tenant_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid tenant id") from exc


@router.post("/boxes", response_model=BoxRecord, status_code=status.HTTP_201_CREATED)
def create_box(
    payload: BoxDefinitionDraft,
    tenant_id: UUID = Depends(resolve_tenant),
    store: BoxStore = Depends(get_box_store),
) -> BoxRecord:
    record = store.create(tenant_id=tenant_id, draft=payload)
    return record


@router.get("/boxes", response_model=BoxCollection)
def list_boxes(
    tenant_id: UUID = Depends(resolve_tenant),
    state: Optional[str] = None,
    store: BoxStore = Depends(get_box_store),
) -> BoxCollection:
    items = list(store.list(tenant_id=tenant_id, state=state))
    return BoxCollection(items=items)


@router.get("/boxes/{box_id}", response_model=BoxRecord)
def get_box(
    box_id: UUID,
    tenant_id: UUID = Depends(resolve_tenant),
    store: BoxStore = Depends(get_box_store),
) -> BoxRecord:
    record = store.get(box_id)
    if record.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")
    return record


@router.patch("/boxes/{box_id}/schema", response_model=BoxRecord)
def update_schema(
    box_id: UUID,
    payload: SchemaUpdateRequest,
    tenant_id: UUID = Depends(resolve_tenant),
    store: BoxStore = Depends(get_box_store),
) -> BoxRecord:
    record = store.get(box_id)
    if record.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")
    updated = store.update_schema(box_id, payload)
    return updated


@router.post(
    "/boxes/{box_id}/embed-token",
    response_model=EmbedTokenResponse,
    status_code=status.HTTP_200_OK,
)
def issue_embed_token(
    box_id: UUID,
    payload: EmbedTokenRequest,
    tenant_id: UUID = Depends(resolve_tenant),
    store: BoxStore = Depends(get_box_store),
    secret: str = Depends(get_embed_secret),
) -> EmbedTokenResponse:
    record = store.get(box_id)
    if record.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")
    token, expires_at = build_embed_token(
        secret=secret,
        tenant_id=tenant_id,
        box_id=box_id,
        app_id=payload.app_id,
        role=payload.role,
        expires_in_seconds=payload.expires_in_seconds,
    )
    return EmbedTokenResponse(token=token, expiresAt=expires_at)


@router.post("/boxes/{box_id}/simulate", response_model=SimulationResponse, status_code=status.HTTP_202_ACCEPTED)
async def simulate_box(
    request: Request,
    box_id: UUID,
    payload: SimulationRequest,
    tenant_id: UUID = Depends(resolve_tenant),
    store: BoxStore = Depends(get_box_store),
    simulations: SimulationStore = Depends(get_simulation_store),
    queue: SimulationQueueBackend = Depends(get_simulation_queue),
) -> SimulationResponse:
    record = store.get(box_id)
    if record.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")
    simulation = simulations.create(box_id=box_id, payload=payload)
    store.set_last_simulation(box_id, simulation.id)
    await queue.enqueue(SimulationJob(simulation_id=simulation.id, payload=payload))
    result = simulations.get(simulation.id)
    return SimulationResponse(
        id=result.id,
        status=result.status,
        mandate_hashes=result.mandate_hashes,
        logs=result.logs,
        created_at=result.created_at,
        updated_at=result.updated_at,
        error=result.error,
    )


@router.get("/simulations/{simulation_id}", response_model=SimulationResponse)
def get_simulation(simulation_id: UUID, simulations: SimulationStore = Depends(get_simulation_store)) -> SimulationResponse:
    record = simulations.get(simulation_id)
    return SimulationResponse(
        id=record.id,
        status=record.status,
        mandate_hashes=record.mandate_hashes,
        logs=record.logs,
        created_at=record.created_at,
        updated_at=record.updated_at,
        error=record.error,
    )


@router.get("/simulations/{simulation_id}/artifacts", response_model=SimulationArtifact)
async def get_simulation_artifacts(
    simulation_id: UUID,
    request: Request,
    simulations: SimulationStore = Depends(get_simulation_store),
) -> SimulationArtifact:
    record = simulations.get(simulation_id)
    if record.status != "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Simulation not completed")
    if record.artifacts:
        return record.artifacts
    repository = request.app.state.artifact_repository
    external = await repository.fetch(simulation_id)
    if not external:
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT, detail="Artifacts unavailable")
    return external


@router.get("/health/simulation", response_model=SimulationHealthResponse)
async def simulation_health(request: Request) -> SimulationHealthResponse:
    queue = get_simulation_queue(request)
    repository = request.app.state.artifact_repository
    metrics = request.app.state.metrics
    return SimulationHealthResponse(
        queue_backend=getattr(request.app.state, "queue_backend_name", queue.__class__.__name__),
        artifact_repository=getattr(request.app.state, "artifact_repository_name", repository.__class__.__name__),
        workers=getattr(request.app.state, "simulation_workers", getattr(queue, "_concurrency", 1)),
        enqueued=metrics.enqueued,
        completed=metrics.completed,
        failed=metrics.failed,
        completed_by_backend=dict(metrics.by_backend),
        connector_success=dict(metrics.connector_success),
        connector_failure=dict(metrics.connector_failure),
    )
