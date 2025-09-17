from sqlalchemy import Column, Integer, String, Float
from API.app.database import Base

class Cooperativa(Base):
    __tablename__ = "cooperativa"

    ID_cooperativa = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(250), index=True)
