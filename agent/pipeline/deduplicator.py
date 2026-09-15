"""
JobCopilot Agent — Cross-Source Deduplication & Authority Resolution
"""
import re
import hashlib
from typing import List, Dict
from agent.scrapers.base_scraper import JobPost

def slugify(text: str) -> str:
    """Creates a normalized alphanumeric slug."""
    text = text.lower()
    text = re.sub(r'[\'\"’]', '', text)
    # Remove accents
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def normalize_company(company: str) -> str:
    """Strips legal entity suffixes and noise."""
    c = company.lower()
    c = re.sub(r'\(.*?\)', '', c)
    c = re.sub(r'\b(s\.?a\.?|s\.?r\.?l\.?|uruguay|grupo|group|consultora|recursos humanos)\b', '', c)
    return slugify(c)

def normalize_title(title: str) -> str:
    """Strips location, IDs, and schedule suffixes from titles for fuzzy deduplication."""
    t = title.lower()
    t = re.sub(r'\(.*?\)', '', t)
    t = re.sub(r'id[\s:\-]*\d+', '', t)
    t = re.sub(r'\b(en montevideo|montevideo|uruguay|part[\s\-]*time|full[\s\-]*time|4[\s]*horas?|6[\s]*horas?|8[\s]*horas?)\b', '', t)
    t = re.sub(r'[\-—|/].*$', '', t)  # Strip after dash or pipe if it specifies location or hours
    return slugify(t)

def make_fingerprint(company: str, title: str, country: str = "UY") -> str:
    """Generates canonical SHA-256 fingerprint for cross-source deduplication."""
    c_slug = normalize_company(company)
    t_slug = normalize_title(title)
    raw = f"{c_slug}:{t_slug}:{country.lower()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def deduplicate_job_posts(jobs: List[JobPost]) -> List[JobPost]:
    """
    Deduplicates a list of JobPost instances.
    If duplicates exist across different sources, resolves to the highest authority source
    (e.g., direct company ATS > recruitment firm > aggregator) and preserves secondary links.
    """
    indexed: Dict[str, JobPost] = {}

    for job in jobs:
        fp = make_fingerprint(job.company, job.title, job.country)
        job.hash_dedup = fp

        if fp not in indexed:
            indexed[fp] = job
        else:
            existing = indexed[fp]
            # Compare source priorities (lower number = higher authority)
            if job.source_priority < existing.source_priority:
                # Promote incoming job as primary canonical
                if existing.apply_url not in job.alternative_urls and existing.apply_url != job.apply_url:
                    job.alternative_urls.append(existing.apply_url)
                job.alternative_urls.extend(existing.alternative_urls)
                indexed[fp] = job
            else:
                # Existing job remains primary, record incoming URL as alternative
                if job.apply_url not in existing.alternative_urls and job.apply_url != existing.apply_url:
                    existing.alternative_urls.append(job.apply_url)

    return list(indexed.values())
