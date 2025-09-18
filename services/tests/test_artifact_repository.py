import os
from types import SimpleNamespace
from uuid import uuid4

import pytest

from schema_registry.models import SimulationArtifact
from schema_registry.repositories import FileSystemArtifactRepository


@pytest.mark.asyncio
async def test_filesystem_repository(tmp_path):
    repo = FileSystemArtifactRepository(root_dir=tmp_path)
    artifact = SimulationArtifact(cart={"hash": "abc"})
    simulation_id = uuid4()

    meta = await repo.save(simulation_id, artifact)
    assert meta["backend"] == "filesystem"
    fetched = await repo.fetch(simulation_id)
    assert fetched is not None
    assert fetched.cart["hash"] == "abc"


@pytest.mark.asyncio
async def test_s3_repository(monkeypatch):
    bucket = "test-sim-artifacts"
    os.environ["SIMULATION_ARTIFACT_BUCKET"] = bucket

    from schema_registry.repository_backends import s3 as s3_module

    storage: dict[str, bytes] = {}

    class FakeBody:
        def __init__(self, data: bytes) -> None:
            self._data = data

        async def read(self) -> bytes:
            return self._data

    class FakeClient:
        exceptions = SimpleNamespace(NoSuchKey=KeyError)

        def __init__(self, storage: dict[str, bytes]) -> None:
            self._storage = storage

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def put_object(self, *, Bucket: str, Key: str, Body: bytes, ContentType: str) -> None:  # noqa: N803
            self._storage[Key] = Body

        async def get_object(self, *, Bucket: str, Key: str):  # noqa: N803
            if Key not in self._storage:
                raise self.exceptions.NoSuchKey(Key)
            return {"Body": FakeBody(self._storage[Key])}

    class FakeSession:
        def client(self, *args, **kwargs):
            return FakeClient(storage)

    monkeypatch.setattr(s3_module.aioboto3, "Session", lambda: FakeSession())

    repo = s3_module.S3ArtifactRepository.from_env()

    artifact = SimulationArtifact(payment={"hash": "def"})
    simulation_id = uuid4()

    meta = await repo.save(simulation_id, artifact)
    assert meta["backend"] == "s3"
    assert meta["bucket"] == bucket

    fetched = await repo.fetch(simulation_id)
    assert fetched is not None
    assert fetched.payment["hash"] == "def"

    os.environ.pop("SIMULATION_ARTIFACT_BUCKET", None)
