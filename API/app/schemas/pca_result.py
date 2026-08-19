from pydantic import BaseModel
from typing import Dict, Optional


class PcaPesoSchema(BaseModel):
    nombre_indicador: str
    categoria_camel: Optional[str] = None
    peso: float
    peso_porcentaje: float


class PcaCategoriaSchema(BaseModel):
    cantidad_cooperativas: int
    cantidad_registros: int
    pesos: Dict[str, PcaPesoSchema]


class PcaUltimoCalculoSchema(BaseModel):
    resultados: Dict[str, PcaCategoriaSchema]


class PcaDatosSchema(BaseModel):
    ultimoCalculo: PcaUltimoCalculoSchema


class PcaResultadosResponse(BaseModel):
    datos: PcaDatosSchema
