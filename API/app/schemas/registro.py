from pydantic import BaseModel
from datetime import datetime

class RegistroSchema(BaseModel):
    ID_registro: int
    ID_indicador: int
    ID_cooperativa: int
    ano: int
    mes: int
    valor: float

    class Config:
        from_attributes = True
