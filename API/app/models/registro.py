from sqlalchemy import Column, Integer, Float, ForeignKey
from app.database import Base

class Registro(Base):
    __tablename__ = "camel_record"

    id_record = Column(Integer, primary_key=True, index=True)
    id_indicator = Column(Integer, ForeignKey("camel_indicator.id_indicator"), index=True)
    id_cooperative = Column(Integer, ForeignKey("cooperative.id_cooperative"), index=True)
    year = Column(Integer, index=True)
    month = Column(Integer, index=True)
    value = Column(Float, index=True)
