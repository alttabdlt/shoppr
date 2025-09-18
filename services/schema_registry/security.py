from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import jwt


def build_embed_token(
    *,
    secret: str,
    tenant_id: UUID,
    box_id: UUID,
    app_id: Optional[str],
    role: str,
    expires_in_seconds: int,
) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=expires_in_seconds)
    payload = {
        "sub": f"box:{box_id}",
        "tenantId": str(tenant_id),
        "boxId": str(box_id),
        "appId": app_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token, exp

