# lca-a1a3-312/backend/main.py

from pathlib import Path
import datetime
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .epd_db import EPD_DB
from .domain.models import CalcRequest, CalcResult, CalcResultLine
from .domain.units import to_declared_qty

app = FastAPI(title="LCA A1–A3 MVP", version="0.1")

# CORS (safe to keep even though frontend is same-origin now)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Serve frontend build at /app ----
FRONTEND_DIR = Path(__file__).parent / "frontend_dist"
# Mount even if empty; once the build is copied here, /app will serve the UI
app.mount("/app", StaticFiles(directory=FRONTEND_DIR, html=True), name="app")
# --------------------------------------

def _valid_status(rec) -> str:
    """Check if an EPD record is still valid based on `valid_until` (YYYY-MM-DD)."""
    vu = rec.get("valid_until")
    if not vu:
        return "unknown"
    try:
        return "valid" if datetime.date.fromisoformat(vu) >= datetime.date.today() else "expired"
    except Exception:
        return "unknown"

@app.get("/")
def root():
    return {"status": "ok", "message": "LCA A1–A3 API running"}

@app.get("/epd")
def list_epd():
    """Return list of available EPDs (minimal fields)."""
    return [
        {
            "id": rec["id"],
            "name": rec["name"],
            "declared_unit": rec["declared_unit"],
            "gwp_a1a3_per_decl_unit": rec["gwp_a1a3_per_decl_unit"],
            "valid": _valid_status(rec),
        }
        for rec in EPD_DB.values()
    ]

@app.post("/calculate", response_model=CalcResult)
def calculate(req: CalcRequest):
    """Calculate total A1–A3 emissions for all selected materials."""
    result_lines: List[CalcResultLine] = []
    all_warnings: List[str] = []

    for line in req.lines:
        rec = EPD_DB.get(line.epd_id)
        if not rec:
            raise HTTPException(status_code=404, detail=f"EPD not found: {line.epd_id}")

        try:
            declared_qty, warns = to_declared_qty(
                declared_unit=rec["declared_unit"],
                input_qty=line.input_qty,
                input_unit=line.input_unit,
                density_kg_m3=line.density_kg_m3 or rec.get("density_kg_m3"),
                user_thickness_mm=line.thickness_mm,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        gwp_per = rec["gwp_a1a3_per_decl_unit"]
        gwp_total = round(gwp_per * declared_qty, 3)

        result_lines.append(
            CalcResultLine(
                epd_id=line.epd_id,
                material_name=rec["name"],
                input_qty=line.input_qty,
                input_unit=line.input_unit,
                declared_qty=round(declared_qty, 4),
                declared_unit=rec["declared_unit"],
                gwp_a1a3_per_decl_unit=gwp_per,
                gwp_a1a3_total=gwp_total,
                epd_valid=_valid_status(rec),
                warnings=warns,
            )
        )
        all_warnings.extend(warns)

    total_sum = round(sum(x.gwp_a1a3_total for x in result_lines), 3)
    return CalcResult(lines=result_lines, sum_gwp_a1a3=total_sum, warnings=all_warnings)
