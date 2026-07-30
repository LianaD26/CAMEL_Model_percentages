from pydantic import BaseModel

class CooperativaSchema(BaseModel):
    id_cooperative: int
    name: str
    category: str = None

    class Config:
        from_attributes = True
