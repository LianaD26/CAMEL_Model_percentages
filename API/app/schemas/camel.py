from pydantic import BaseModel

class CamelSchema(BaseModel):
    id_camel: int
    name: str

    class Config:
        from_attributes = True
