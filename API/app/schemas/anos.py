from pydantic import BaseModel
from typing import List

class Ano(BaseModel):
    ano: List[int]

    class Config:
        from_attributes = True

class AnoResponse(BaseModel):
    """Schema para la respuesta de años únicos"""
    anos: List[int]
    total: int

    class Config:
        from_attributes = True
