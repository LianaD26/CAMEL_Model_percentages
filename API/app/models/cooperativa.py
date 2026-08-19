from sqlalchemy import Column, Integer, String
from app.database import Base

class Cooperativa(Base):
    __tablename__ = "cooperative"

    id_cooperative = Column(Integer, primary_key=True, index=True)
    name = Column(String(250), index=True)
    category = Column(String(250), index=True)

