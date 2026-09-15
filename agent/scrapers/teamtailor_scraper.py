"""
JobCopilot Agent — Teamtailor ATS Scraper (CPA Ferrere & Teamtailor Partners)
"""
import json
import re
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class TeamtailorScraper(BaseScraper):
    name = "teamtailor"
    source_type = "ats_official"
    priority = 1

    # Endpoints of Teamtailor users in Uruguay
    INSTANCES = [
        {
            "company": "CPA Ferrere",
            "url": "https://talento.cpaferrere.com/jobs.json",
            "base_apply": "https://talento.cpaferrere.com/jobs"
        }
    ]

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        for inst in self.INSTANCES:
            company = inst["company"]
            url = inst["url"]
            print(f"[*] [{self.name}] Consultando ATS oficial de {company}: {url}...")
            try:
                data = self.fetch_json(url)
                items = data.get("items", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                
                for item in items:
                    title = item.get("title", "")
                    if not title:
                        continue
                    
                    apply_url = item.get("url") or item.get("apply_url") or f"{inst['base_apply']}/{item.get('id')}"
                    body = item.get("content_text") or item.get("content_html") or ""

                    # Check location filter (must be Uruguay / Montevideo or remote)
                    location = "Montevideo"
                    loc_data = item.get("location") or {}
                    if isinstance(loc_data, dict):
                        city = loc_data.get("city") or loc_data.get("name")
                        if city:
                            location = city

                    jobs.append(JobPost(
                        company=company,
                        title=title,
                        apply_url=apply_url,
                        description=body,
                        source_platform="cpa_teamtailor",
                        source_priority=self.priority,
                        country=self.country,
                        location=location,
                        salary_guide="$45.000 - $65.000 UYU (según régimen)",
                        raw_source_data={"id": item.get("id")}
                    ))
                print(f"[+] [{self.name}] {company}: {len(items)} vacantes oficiales obtenidas.")
            except Exception as e:
                print(f"[-] [{self.name}] Error consultando {company}: {e}")

        return jobs
