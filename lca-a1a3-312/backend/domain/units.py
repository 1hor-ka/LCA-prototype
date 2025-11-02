import re
from typing import List

_M2_T = re.compile(r"^m2[·x\*](\d+)mm$", re.IGNORECASE)

def _parse_unit(u: str) -> tuple[str, float | None]:
    u = u.strip()
    m = _M2_T.match(u)
    if m:
        return "m2_t", float(m.group(1))
    if u in {"kg", "m3", "m2", "unit"}:
        return u, None
    raise ValueError(f"Unsupported unit: {u}")

def to_declared_qty(
    declared_unit: str,
    input_qty: float,
    input_unit: str,
    density_kg_m3: float | None,
    user_thickness_mm: float | None
) -> tuple[float, List[str]]:
    warns: List[str] = []
    du_kind, du_t = _parse_unit(declared_unit)
    in_kind, in_t = _parse_unit(input_unit)

    if du_kind == in_kind in {"kg", "m3", "m2", "unit"}:
        return input_qty, warns

    if du_kind == "m2_t" and in_kind == "m2_t":
        return input_qty * (in_t / du_t), warns

    if density_kg_m3:
        if du_kind == "kg" and in_kind == "m3":
            return input_qty * density_kg_m3, warns
        if du_kind == "m3" and in_kind == "kg":
            return input_qty / density_kg_m3, warns

    if du_kind == "m2_t" and in_kind == "m2":
        if user_thickness_mm and du_t:
            return input_qty * (user_thickness_mm / du_t), warns
        raise ValueError(f"Thickness required to convert {input_unit} -> {declared_unit}")

    raise ValueError(f"Unsupported conversion: {input_unit} -> {declared_unit}")
