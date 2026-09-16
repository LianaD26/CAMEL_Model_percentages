from pydantic import BaseModel
from typing import List, Dict

class CooperativaCAMELResult(BaseModel):
    id_cooperative: int
    nombre_cooperativa: str
    result: float

    class Config:
        from_attributes = True


class CamelResultPorCategoria(BaseModel):
    categoria: str
    cantidad_cooperativas: int
    cantidad_registros: int
    cooperativas: List[CooperativaCAMELResult]


class CamelResultadosResponse(BaseModel):
    datos: Dict[str, CamelResultPorCategoria]
