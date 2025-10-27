from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Camel(Base):
    __tablename__ = "camel"

    ID_camel = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(250), index=True)
