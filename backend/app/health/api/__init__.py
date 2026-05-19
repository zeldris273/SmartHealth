from .bmi import router as bmi_router
from .calories import router as calories_router

__all__ = ["bmi_router", "calories_router", "chat_router"]

from .chat import router as chat_router
