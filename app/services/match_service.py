from __future__ import annotations

from typing import Tuple

from ..nlp import match_score


def score_resume_to_job(resume_text: str, resume_skills: list[str], jd_text: str, jd_skills: list[str]) -> float:
    return match_score(resume_text, resume_skills, jd_text, jd_skills)


