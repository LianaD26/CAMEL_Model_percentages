from sqlalchemy import Column, Integer, String, Float,ForeignKey
from API.app.database import Base

class Registro(Base):
    __tablename__ = "registro"

    ID_registro = Column(Integer, primary_key=True, index=True)
    ID_indicador = Column(Integer, ForeignKey("indicador.ID_indicador"), index=True)
    ID_cooperativa = Column(Integer, ForeignKey("cooperativa.ID_cooperativa"), index=True)
    ano = Column(Integer, index=True)
    mes = Column(Integer, index=True)
    valor = Column(Float, index=True)
