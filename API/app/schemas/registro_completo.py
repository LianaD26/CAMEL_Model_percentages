from pydantic import BaseModel

class RegistroCompletoSchema(BaseModel):
    nombre_camel: str
    nombre_indicador: str
    nombre_cooperativa: str
    ano: int
    mes: int
    ID_registro: int
    valor: float

    class Config:
        from_attributes = True
