from pydantic import BaseModel

from typing import Dict


class PercentilIndicadorSchema(BaseModel):

    nombre_indicador: str

    categoria_camel: str | None = None

    p20: float
    p40: float
    p60: float
    p80: float


class PercentilCategoriaSchema(BaseModel):

    cantidad_cooperativas: int

    cantidad_registros: int

    percentiles: Dict[str, PercentilIndicadorSchema]


class PercentilDatosSchema(BaseModel):

    percentiles_generales: PercentilCategoriaSchema

    percentiles_por_categoria: Dict[str, PercentilCategoriaSchema]


class PercentilResultadosResponse(BaseModel):

    datos: PercentilDatosSchema