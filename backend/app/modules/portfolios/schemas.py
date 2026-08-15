from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ColorPaletteSchema(BaseModel):
    primary: str = Field(default="#3b82f6")
    secondary: str = Field(default="#1e3a8a")
    background: str = Field(default="#ffffff")
    text: str = Field(default="#1f2937")

class PortfolioSaveRequest(BaseModel):
    username: str = Field(..., description="Unique slug for portfolio URL")
    template_id: str = Field(..., description="Selected template (modern, minimal, creative)")
    color_palette: ColorPaletteSchema
    enabled_pages: List[str] = Field(default_factory=list)
    page_content: Dict[str, Any] = Field(default_factory=dict)

class PortfolioResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_email: str
    username: str
    role: str
    template_id: str
    color_palette: ColorPaletteSchema
    enabled_pages: List[str]
    page_content: Dict[str, Any]
    is_deployed: bool
    deployed_at: Optional[datetime] = None
    last_updated: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
