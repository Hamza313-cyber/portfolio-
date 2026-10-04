"""Request and response shapes. Every field has a type and a size limit."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator


class _Strict(BaseModel):
    # Unknown fields are rejected instead of silently ignored.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ContactIn(_Strict):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=254)
    message: str = Field(min_length=10, max_length=5000)
    # Honeypot: hidden in the form. People leave it empty, bots fill it in.
    website: str = Field(default="", max_length=200)
    turnstile_token: str = Field(default="", max_length=4096)

    @field_validator("name", "message")
    @classmethod
    def no_control_chars(cls, value: str) -> str:
        cleaned = "".join(ch for ch in value if ch == "\n" or ch == "\t" or ord(ch) >= 32)
        return cleaned


ProjectStatus = Literal["live", "in_progress"]


class ProjectIn(_Strict):
    title: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=5, max_length=600)
    tags: list[str] = Field(default_factory=list, max_length=8)
    live_url: HttpUrl | None = None
    code_url: HttpUrl | None = None
    status: ProjectStatus = "live"
    sort_order: int = Field(default=0, ge=0, le=1000)
    is_published: bool = True

    @field_validator("tags")
    @classmethod
    def tag_limits(cls, tags: list[str]) -> list[str]:
        cleaned = [t.strip() for t in tags if t.strip()]
        if any(len(t) > 30 for t in cleaned):
            raise ValueError("each tag must be 30 characters or fewer")
        return cleaned

    def to_row(self) -> dict:
        row = self.model_dump()
        row["live_url"] = str(self.live_url) if self.live_url else None
        row["code_url"] = str(self.code_url) if self.code_url else None
        return row


class Project(BaseModel):
    id: str
    title: str
    description: str
    tags: list[str]
    live_url: str | None
    code_url: str | None
    status: ProjectStatus
    sort_order: int
    is_published: bool


class Message(BaseModel):
    id: str
    name: str
    email: str
    message: str
    status: Literal["new", "read", "archived"]
    created_at: datetime


class MessageStatusIn(_Strict):
    status: Literal["new", "read", "archived"]
