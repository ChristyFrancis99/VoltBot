from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


FiniteFloat = Annotated[float, Field(allow_inf_nan=False)]
NonNegativeFloat = Annotated[float, Field(ge=0, allow_inf_nan=False)]
CellVoltage = Annotated[float, Field(ge=0, allow_inf_nan=False)]
DemoScenario = Literal[
    "normal",
    "healthy",
    "degradation",
    "overheating",
    "cell_imbalance",
    "multiple_faults",
]


class DemoScenarioRequest(BaseModel):
    scenario: DemoScenario
    advance: bool = False


class SensorData(BaseModel):
    device_id: str = Field(min_length=1)
    timestamp: datetime | None = None
    voltage: NonNegativeFloat
    # Positive current is discharge; negative current is charging.
    current: FiniteFloat
    temperature: float = Field(ge=-40, le=125, allow_inf_nan=False)
    cell_voltages: list[CellVoltage] = Field(min_length=1)


class BatteryReading(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    voltage: float
    current: float
    temperature: float
    cell_voltages: list[float] = Field(default_factory=list)
    power_w: float | None = None
    cell_min_v: float | None = None
    cell_max_v: float | None = None
    cell_imbalance_v: float | None = None
    temperature_status: str | None = None
    voltage_status: str | None = None
    current_status: str | None = None
    cell_status: str | None = None
    overall_status: str | None = None
    alerts: list[str] = Field(default_factory=list)
    health_status: str | None = None
    health_score: int | None = None
    operating_state: str | None = None
    patterns: list[str] = Field(default_factory=list)
    pattern_flags: dict[str, bool] = Field(default_factory=dict)
    voltage_trend_v_per_min: float | None = None
    temperature_trend_c_per_min: float | None = None
    current_trend_a_per_min: float | None = None
    cell_imbalance_trend_v_per_min: float | None = None
    average_voltage_v: float | None = None
    average_current_a: float | None = None
    average_temperature_c: float | None = None
    maximum_temperature_c: float | None = None
    minimum_voltage_v: float | None = None
    recent_current_behavior: str | None = None
    health_sample_count: int | None = None
    demo_scenario: str | None = None
    demo_stage: int | None = None
    demo_session_id: str | None = None

    # Legacy response fields remain available for existing consumers.
    power: float
    cell_min: float
    cell_max: float
    cell_imbalance: float


class HealthResponse(BaseModel):
    status: str
