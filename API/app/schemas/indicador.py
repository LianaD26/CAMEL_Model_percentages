from pydantic import BaseModel

class IndicadorSchema(BaseModel):
    ID_indicador: int
    ID_camel: int
    nombre: str

    class Config:
        from_attributes = True
