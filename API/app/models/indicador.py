from sqlalchemy import Column, Integer, String, Float, ForeignKey
from API.app.database import Base

class Indicador(Base):
    __tablename__ = "indicador"

    ID_indicador = Column(Integer, primary_key=True, index=True)
    ID_camel = Column(Integer, ForeignKey("camel.ID_camel"), index=True)
    nombre = Column(String(250), index=True)
