import os
from functools import lru_cache
from dotenv import load_dotenv


class Settings:
    def __init__(self) -> None:
        # Load .env once when settings are first constructed
        load_dotenv(override=False)
        self.database_url: str = os.getenv("DATABASE_URL", "sqlite:///./ats.db")
        self.jwt_secret: str = os.getenv("JWT_SECRET", "change_me")
        self.jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        self.storage_dir: str = os.getenv("STORAGE_DIR", "storage")


@lru_cache
def get_settings() -> Settings:
    return Settings()

