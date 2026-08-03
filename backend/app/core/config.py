"""Application settings (12-factor: everything from env / .env)."""
from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ---- Database: existing SQL Server (loaded as-is), via ODBC Driver 18 ----
    # Use 127.0.0.1 (not "localhost"): ODBC Driver 18 tries IPv6 ::1 first, which
    # Colima does not forward, causing a login timeout.
    db_host: str = "127.0.0.1"
    db_port: int = 1433
    db_name: str = "PSNSUniversityOnline"
    db_user: str = "sa"
    db_password: str = "Ptsnsu_Dev#2026"
    db_driver: str = "ODBC Driver 18 for SQL Server"

    # ---- App ----
    app_name: str = "PTSNSU ERP API"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]
    frontend_dist: str | None = None

    # ---- Auth (JWT) ----
    jwt_secret: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    refresh_token_days: int = 7

    # ---- AES compat (mirrors legacy globalconnection.Encrypt/Decrypt) ----
    legacy_aes_key: str = "RSG3KF2STIRHOHG84C4EGRTV5"

    # ---- File storage base (legacy served photos/sign from this web path) ----
    uploads_base: str = "https://ptsnsuonline.com/uims/Uploads/"

    # ---- SabPaisa payment gateway (move to a secret store in prod) ----
    sabpaisa_client_code: str = ""
    sabpaisa_trans_user: str = ""
    sabpaisa_trans_pass: str = ""
    sabpaisa_auth_key: str = ""
    sabpaisa_auth_iv: str = ""
    sabpaisa_init_url: str = "https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1"
    sabpaisa_callback_url: str = "http://localhost:8000/payments/callback"
    portal_fee: float = 50.0

    # ---- Admission (second DB) ----
    adm_db_name: str = "PtsnsuAdmission"

    def _url(self, db_name: str) -> str:
        params = f"driver={quote_plus(self.db_driver)}&TrustServerCertificate=yes&Encrypt=yes"
        return (
            f"mssql+pyodbc://{self.db_user}:{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{db_name}?{params}"
        )

    @property
    def sqlalchemy_url(self) -> str:
        return self._url(self.db_name)

    @property
    def adm_sqlalchemy_url(self) -> str:
        return self._url(self.adm_db_name)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
