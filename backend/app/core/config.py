import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Academy Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyforacademydevelopment123!#")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_URL: str = ""
    DATABASE_NAME: str = "academy_db"
    CLOUDINARY_URL: str = ""

    def model_post_init(self, __context):
        if not self.MONGODB_URL:
            self.MONGODB_URL = self.MONGODB_URI
        if self.CLOUDINARY_URL:
            os.environ["CLOUDINARY_URL"] = self.CLOUDINARY_URL


    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "no-reply@academy.com"
    EMAILS_FROM_NAME: str = "Academy Library"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
