from pydantic import BaseModel

class CamelSchema(BaseModel):
    ID_camel: int
    nombre: str

    class Config:
        from_attributes = True
