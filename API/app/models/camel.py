from sqlalchemy import Column, Integer, String
from app.database import Base

class Camel(Base):
    __tablename__ = "camel_level"

    id_camel = Column(Integer, primary_key=True, index=True)
    name = Column(String(250), index=True)
