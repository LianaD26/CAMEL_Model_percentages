from pydantic import BaseModel

class IndicadorSchema(BaseModel):
    id_indicator: int
    id_camel: int
    name: str

    class Config:
        from_attributes = True
