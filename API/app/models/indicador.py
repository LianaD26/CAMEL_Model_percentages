from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Indicador(Base):
    __tablename__ = "camel_indicator"

    id_indicator = Column(Integer, primary_key=True, index=True)
    id_camel = Column(Integer, ForeignKey("camel_level.id_camel"), index=True)
    name = Column(String(250), index=True)
