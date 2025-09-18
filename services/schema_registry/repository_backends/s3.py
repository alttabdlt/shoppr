from __future__ import annotations

import json
import os
from typing import Dict, Optional
from uuid import UUID

import aioboto3

from ..models import SimulationArtifact
from ..repositories import ArtifactRepository


class S3ArtifactRepository(ArtifactRepository):
    def __init__(
        self,
        *,
        bucket: str,
        prefix: str = "simulation-artifacts/",
        endpoint_url: Optional[str] = None,
        region_name: Optional[str] = None,
    ) -> None:
        self.bucket = bucket
        self.prefix = prefix
        self.endpoint_url = endpoint_url
        self.region_name = region_name

    def _object_key(self, simulation_id: UUID) -> str:
        return f"{self.prefix}{simulation_id}.json"

    async def save(self, simulation_id: UUID, artifact: SimulationArtifact) -> Dict[str, str]:
        key = self._object_key(simulation_id)
        async with aioboto3.Session().client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=self.region_name,
        ) as client:
            await client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=json.dumps(artifact.dict()).encode("utf-8"),
                ContentType="application/json",
            )
        return {"backend": "s3", "bucket": self.bucket, "key": key}

    async def fetch(self, simulation_id: UUID) -> Optional[SimulationArtifact]:
        key = self._object_key(simulation_id)
        async with aioboto3.Session().client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=self.region_name,
        ) as client:
            try:
                response = await client.get_object(Bucket=self.bucket, Key=key)
            except client.exceptions.NoSuchKey:  # type: ignore[attr-defined]
                return None
            data = await response["Body"].read()
        payload = json.loads(data)
        return SimulationArtifact(**payload)

    @classmethod
    def from_env(cls) -> "S3ArtifactRepository":
        bucket = os.environ["SIMULATION_ARTIFACT_BUCKET"]
        prefix = os.environ.get("SIMULATION_ARTIFACT_PREFIX", "simulation-artifacts/")
        endpoint_url = os.environ.get("SIMULATION_ARTIFACT_ENDPOINT")
        region = os.environ.get("SIMULATION_ARTIFACT_REGION")
        return cls(bucket=bucket, prefix=prefix, endpoint_url=endpoint_url, region_name=region)

