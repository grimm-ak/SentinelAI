
from pydantic import BaseModel, Field


class TrafficRequest(BaseModel):
    features: dict[str, float | int | str]


class DetectionResponse(BaseModel):
    id: int
    is_attack: bool
    attack_probability: float
    attack_category: str
    severity: str
    created_at: str
