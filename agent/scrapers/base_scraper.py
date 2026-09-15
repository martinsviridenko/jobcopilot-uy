"""
JobCopilot Agent — Base Scraper Interface and JobPost Data Model
"""
import ssl
import json
import random
import urllib.request
import urllib.parse
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from agent.config import USER_AGENTS, REQUEST_TIMEOUT, DEFAULT_COUNTRY

@dataclass
class JobPost:
    company: str
    title: str
    apply_url: str
    description: str
    source_platform: str
    source_priority: int = 5
    country: str = DEFAULT_COUNTRY
    location: str = "Montevideo"
    hours: str = "8h"                     # '4h', '6h', '8h'
    hours_label: str = "8 horas"
    is_hours_estimated: bool = False
    modality: str = "Presencial"          # 'Híbrido', 'Remoto', 'Presencial'
    modality_key: str = "presential"      # 'hybrid', 'remote', 'presential'
    sector: str = "consulting"
    sector_label: str = "Consultoría & Servicios"
    domain: str = "BUSINESS_ADMIN"
    domain_label: str = "Negocios & Administración"
    seniority: str = "Junior"             # 'Trainee', 'Junior', 'Semi-Senior', 'Senior'
    contract_type: str = "indefinido"     # 'pasantia', 'termino', 'indefinido'
    salary_guide: Optional[str] = None
    career_fit: List[str] = field(default_factory=list)
    critical_skills: List[str] = field(default_factory=list)
    requirements: Dict[str, List[str]] = field(default_factory=lambda: {"mandatory": [], "desirable": [], "bonus": []})
    is_talent_pool: bool = False
    is_active: bool = True
    published_at: Optional[str] = None
    canonical_source: Optional[str] = None
    alternative_urls: List[str] = field(default_factory=list)
    raw_source_data: Dict[str, Any] = field(default_factory=dict)
    hash_dedup: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "company": self.company,
            "title": self.title,
            "apply_url": self.apply_url,
            "description": self.description,
            "source_platform": self.source_platform,
            "country": self.country,
            "location": self.location,
            "hours": self.hours,
            "hours_label": self.hours_label,
            "is_hours_estimated": self.is_hours_estimated,
            "modality": self.modality,
            "modality_key": self.modality_key,
            "sector": self.sector,
            "sector_label": self.sector_label,
            "domain": self.domain,
            "domain_label": self.domain_label,
            "seniority": self.seniority,
            "contract_type": self.contract_type,
            "salary_guide": self.salary_guide or "A convenir / Según mercado",
            "career_fit": self.career_fit,
            "critical_skills": self.critical_skills,
            "requirements": self.requirements,
            "is_talent_pool": self.is_talent_pool,
            "is_active": self.is_active,
            "hash_dedup": self.hash_dedup
        }

class BaseScraper:
    """
    Abstract Base Class for all JobCopilot source scrapers.
    """
    name: str = "base"
    source_type: str = "general_web"
    priority: int = 5

    def __init__(self, country: str = DEFAULT_COUNTRY):
        self.country = country
        self.ctx = ssl.create_default_context()
        self.ctx.check_hostname = False
        self.ctx.verify_mode = ssl.CERT_NONE

    def fetch_url(self, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = REQUEST_TIMEOUT) -> str:
        req_headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
            "Accept-Language": "es-UY,es;q=0.9,en;q=0.8"
        }
        if headers:
            req_headers.update(headers)
        
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, timeout=timeout, context=self.ctx) as resp:
            return resp.read().decode('utf-8', errors='ignore')

    def fetch_json(self, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = REQUEST_TIMEOUT) -> Any:
        raw = self.fetch_url(url, headers=headers, timeout=timeout)
        return json.loads(raw)

    def fetch_jobs(self) -> List[JobPost]:
        """
        Subclasses must implement this method.
        Must return a list of JobPost objects.
        """
        raise NotImplementedError("Scraper must implement fetch_jobs()")
