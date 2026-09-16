from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.database import Base

class CamelResult(Base):
    __tablename__ = "camel_result"

    id_camel_result = Column(Integer, primary_key=True, index=True)
    id_cooperative = Column(Integer, ForeignKey("cooperative.id_cooperative"), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    result = Column(Numeric(20, 10), nullable=False)
