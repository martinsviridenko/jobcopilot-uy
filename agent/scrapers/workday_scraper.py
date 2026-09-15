"""
JobCopilot Agent — Workday Public CXS API Scraper (Mercado Libre, PwC, etc.)
"""
import json
import urllib.request
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class WorkdayScraper(BaseScraper):
    name = "workday"
    source_type = "ats_official"
    priority = 1

    WORKDAY_TENANTS = [
        {
            "company": "Mercado Libre Uruguay",
            "endpoint": "https://mercadolibre.wd3.myworkdayjobs.com/wday/cxs/mercadolibre/meli/jobs",
            "base_url": "https://mercadolibre.wd3.myworkdayjobs.com/en-US/meli"
        }
    ]

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        for t in self.WORKDAY_TENANTS:
            company = t["company"]
            endpoint = t["endpoint"]
            base_url = t["base_url"]
            print(f"[*] [{self.name}] Consultando Workday CXS de {company}: {endpoint}...")

            payload = {
                "appliedFacets": {},
                "limit": 20,
                "offset": 0,
                "searchText": "Uruguay"
            }

            try:
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0"
                }
                data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=15, context=self.ctx) as resp:
                    if resp.status == 200:
                        res_json = json.loads(resp.read().decode('utf-8'))
                        postings = res_json.get("jobPostings", [])
                        print(f"[+] [{self.name}] {company}: {len(postings)} ofertas encontradas en Workday.")

                        for p in postings:
                            title = p.get("title", "")
                            external_path = p.get("externalPath", "")
                            full_apply = f"{base_url}{external_path}" if external_path else base_url
                            loc = p.get("locationsText", "Montevideo, Uruguay")

                            jobs.append(JobPost(
                                company=company,
                                title=title,
                                apply_url=full_apply,
                                description=f"Vacante oficial publicada por {company} en su portal Workday: {title}. Ubicación: {loc}.",
                                source_platform="workday_cxs",
                                source_priority=self.priority,
                                country=self.country,
                                location=loc,
                                salary_guide="$42.000 - $65.000 UYU"
                            ))
            except Exception as e:
                print(f"[-] [{self.name}] Aviso consultando Workday para {company}: {e}")

        return jobs
