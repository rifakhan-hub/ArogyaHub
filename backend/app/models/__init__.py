# Import every model here so creating the tables finds all of them.
from app.models.user import Role, User

__all__ = ["Role", "User"]
