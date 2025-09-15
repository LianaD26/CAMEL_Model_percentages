from pydantic import BaseModel

class CooperativaSchema(BaseModel):
    ID_cooperativa: int
    nombre: str

    class Config:
        from_attributes = True
