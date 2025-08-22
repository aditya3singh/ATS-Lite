from __future__ import annotations

import io
import os
from typing import Tuple

from pdfminer.high_level import extract_text as pdf_extract_text
from docx import Document

from ..nlp import extract_skills


def parse_pdf(path: str) -> str:
    try:
        return pdf_extract_text(path) or ""
    except Exception:
        return ""


def parse_docx(path: str) -> str:
    try:
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception:
        return ""


def parse_file_to_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return parse_pdf(path)
    if ext in {".docx"}:
        return parse_docx(path)
    # Fallback to reading as text
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""


def extract_text_and_skills(path: str) -> Tuple[str, list[str]]:
    text = parse_file_to_text(path)
    skills = extract_skills(text)
    return text, skills


