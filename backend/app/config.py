from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    rebrickable_api_key: str
    brickset_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
