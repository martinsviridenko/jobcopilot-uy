"""
JobCopilot Agent — Greenhouse Official ATS Scraper (dLocal, PedidosYa, etc.)
"""
import re
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class GreenhouseScraper(BaseScraper):
    name = "greenhouse"
    source_type = "ats_official"
    priority = 1

    # Companies with official Greenhouse boards operating in Uruguay
    BOARDS = [
        {
            "company": "dLocal FinTech",
            "board_token": "dlocal",
            "location_filters": ["montevideo", "uruguay", "remote"]
        },
        {
            "company": "PedidosYa (Delivery Hero)",
            "board_token": "pedidosya",
            "location_filters": ["montevideo", "uruguay"]
        }
    ]

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        for b in self.BOARDS:
            company = b["company"]
            token = b["board_token"]
            url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
            print(f"[*] [{self.name}] Consultando Greenhouse API de {company}: {url}...")
            try:
                data = self.fetch_json(url)
                items = data.get("jobs", [])
                matched = 0

                for item in items:
                    title = item.get("title", "")
                    loc_obj = item.get("location") or {}
                    loc_name = loc_obj.get("name", "").lower()

                    # Filter for Uruguay / Montevideo or remote
                    is_uruguay = any(lf in loc_name for lf in b["location_filters"])
                    if not is_uruguay and "uruguay" not in title.lower():
                        continue

                    apply_url = item.get("absolute_url") or f"https://boards.greenhouse.io/{token}/jobs/{item.get('id')}"
                    content = item.get("content", "")

                    jobs.append(JobPost(
                        company=company,
                        title=title,
                        apply_url=apply_url,
                        description=content,
                        source_platform=f"greenhouse_{token}",
                        source_priority=self.priority,
                        country=self.country,
                        location="Montevideo",
                        salary_guide="$48.000 - $75.000 UYU (según seniority)",
                        raw_source_data={"greenhouse_id": item.get("id"), "departments": item.get("departments", [])}
                    ))
                    matched += 1

                print(f"[+] [{self.name}] {company}: {matched} vacantes para Uruguay obtenidas de {len(items)} totales.")
            except Exception as e:
                print(f"[-] [{self.name}] Error consultando Greenhouse para {company}: {e}")

        return jobs
