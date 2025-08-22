import os
import uuid
from typing import Tuple

from fastapi import UploadFile

from ..config import get_settings


settings = get_settings()


def save_upload(file: UploadFile) -> Tuple[str, str]:
    os.makedirs(settings.storage_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(settings.storage_dir, unique_name)
    with open(dest_path, "wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    return unique_name, dest_path


