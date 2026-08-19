from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.database import Base

class PercentileResult(Base):
    __tablename__ = "percentile_result"

    id_percentile_result = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    quantity_cooperatives = Column(Integer, nullable=False)
    quantity_records = Column(Integer, nullable=False)
    id_indicator = Column(Integer, ForeignKey("camel_indicator.id_indicator"), nullable=False)
    p10 = Column(Numeric(20, 10))
    p20 = Column(Numeric(20, 10))
    p30 = Column(Numeric(20, 10))
    p40 = Column(Numeric(20, 10))
    p50 = Column(Numeric(20, 10))
    p60 = Column(Numeric(20, 10))
    p70 = Column(Numeric(20, 10))
    p80 = Column(Numeric(20, 10))
    p90 = Column(Numeric(20, 10))
