from __future__ import annotations

import re
from typing import List

# Lightweight fallback NLP: regex-based skill extraction and simple overlap-based similarity.

SKILL_PATTERN = re.compile(
    r"\b(python|java|c\+\+|sql|aws|docker|kubernetes|react|node|fastapi|nlp|ml|pandas|numpy|scikit-learn|tensorflow|pytorch)\b",
    re.I,
)


def extract_skills(text: str) -> List[str]:
    skills = {m.lower() for m in SKILL_PATTERN.findall(text or "")}
    return sorted(skills)


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    return len(a & b) / float(len(a | b) or 1)


def match_score(resume_text: str, resume_skills: List[str], jd_text: str, jd_skills: List[str]) -> float:
    # Simple text overlap proxy: count shared keywords from the skill list present in the texts
    resume_words = set([w.lower() for w in re.findall(r"[a-zA-Z\+#\.]+", resume_text or "")])
    jd_words = set([w.lower() for w in re.findall(r"[a-zA-Z\+#\.]+", jd_text or "")])
    text_overlap = _jaccard(resume_words, jd_words)

    # Skill overlap
    skill_overlap = _jaccard(set(map(str.lower, resume_skills or [])), set(map(str.lower, jd_skills or [])))

    return float(0.6 * text_overlap + 0.4 * skill_overlap)

