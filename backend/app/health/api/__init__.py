from .bmi import router as bmi_router
from .calories import router as calories_router
from .health_tips import router as health_tips_router
from .admin_stats import router as admin_stats_router

__all__ = ["bmi_router", "calories_router", "health_tips_router", "chat_router", "admin_stats_router"]

from .chat import router as chat_router
