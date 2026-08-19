from pydantic import BaseModel
from typing import Dict, Optional


class PercentilIndicadorSchema(BaseModel):
    nombre_indicador: str
    categoria_camel: Optional[str] = None
    p10: Optional[float] = None
    p20: Optional[float] = None
    p30: Optional[float] = None
    p40: Optional[float] = None
    p50: Optional[float] = None
    p60: Optional[float] = None
    p70: Optional[float] = None
    p80: Optional[float] = None
    p90: Optional[float] = None


class PercentilCategoriaSchema(BaseModel):
    cantidad_cooperativas: int
    cantidad_registros: int
    percentiles: Dict[str, PercentilIndicadorSchema]


class PercentilDatosSchema(BaseModel):
    percentiles_generales: PercentilCategoriaSchema
    percentiles_por_categoria: Dict[str, PercentilCategoriaSchema]


class PercentilResultadosResponse(BaseModel):
    datos: PercentilDatosSchema
