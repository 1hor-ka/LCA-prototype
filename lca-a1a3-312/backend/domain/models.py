from pydantic import BaseModel, Field
from typing import List

class CalcLine(BaseModel):
    epd_id: str
    input_qty: float
    input_unit: str
    density_kg_m3: float | None = None
    thickness_mm: float | None = None

class CalcRequest(BaseModel):
    lines: List[CalcLine]

class CalcResultLine(BaseModel):
    epd_id: str
    material_name: str
    input_qty: float
    input_unit: str
    declared_qty: float
    declared_unit: str
    gwp_a1a3_per_decl_unit: float
    gwp_a1a3_total: float
    epd_valid: str
    warnings: List[str]

class CalcResult(BaseModel):
    lines: List[CalcResultLine]
    sum_gwp_a1a3: float
    warnings: List[str]
