from pydantic import BaseModel
from datetime import datetime

class RegistroSchema(BaseModel):
    id_record: int
    id_indicator: int
    id_cooperative: int
    year: int
    month: int
    value: float

    class Config:
        from_attributes = True
