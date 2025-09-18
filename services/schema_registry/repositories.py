from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Optional
from uuid import UUID

from .models import SimulationArtifact


class ArtifactRepository(ABC):
    @abstractmethod
    async def save(self, simulation_id: UUID, artifact: SimulationArtifact) -> Dict[str, str]:  # pragma: no cover - interface
        ...

    @abstractmethod
    async def fetch(self, simulation_id: UUID) -> Optional[SimulationArtifact]:  # pragma: no cover - interface
        ...


class MemoryArtifactRepository(ArtifactRepository):
    def __init__(self) -> None:
        self._store: Dict[UUID, SimulationArtifact] = {}

    async def save(self, simulation_id: UUID, artifact: SimulationArtifact) -> Dict[str, str]:
        self._store[simulation_id] = artifact
        return {"backend": "memory"}

    async def fetch(self, simulation_id: UUID) -> Optional[SimulationArtifact]:
        return self._store.get(simulation_id)


class FileSystemArtifactRepository(ArtifactRepository):
    def __init__(self, root_dir: str | Path = "./services/schema_registry/data") -> None:
        self._root = Path(root_dir)
        self._root.mkdir(parents=True, exist_ok=True)

    async def save(self, simulation_id: UUID, artifact: SimulationArtifact) -> Dict[str, str]:
        target = self._root / f"{simulation_id}.json"
        with target.open("w", encoding="utf-8") as fp:
            json.dump(artifact.dict(), fp, indent=2)
        return {"backend": "filesystem", "path": str(target.resolve())}

    async def fetch(self, simulation_id: UUID) -> Optional[SimulationArtifact]:
        target = self._root / f"{simulation_id}.json"
        if not target.exists():
            return None
        with target.open("r", encoding="utf-8") as fp:
            payload = json.load(fp)
        return SimulationArtifact(**payload)


def load_repository(dotted_path: str | None) -> ArtifactRepository:
    if not dotted_path or dotted_path == "memory":
        return MemoryArtifactRepository()
    if dotted_path == "filesystem":
        root_dir = os.environ.get("SIMULATION_ARTIFACT_ROOT", "./services/schema_registry/data")
        return FileSystemArtifactRepository(root_dir=root_dir)
    if dotted_path == "s3":
        from .repository_backends.s3 import S3ArtifactRepository

        return S3ArtifactRepository.from_env()

    module_path, _, attr = dotted_path.rpartition(".")
    if not module_path:
        raise ValueError("SIMULATION_ARTIFACT_REPOSITORY must be 'memory', 'filesystem', or a dotted path")

    module = __import__(module_path, fromlist=[attr])
    repo_cls = getattr(module, attr)
    return repo_cls()
