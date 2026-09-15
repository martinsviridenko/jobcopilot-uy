"""
JobCopilot Agent — Gallito Luis Job Scraper (Uruguay)
"""
import re
import json
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class GallitoScraper(BaseScraper):
    name = "gallito"
    source_type = "gallito"
    priority = 5

    FEED_URL = "https://www.gallito.com.uy/empleos/ofertas"

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        print(f"[*] [{self.name}] Consultando ofertas públicas en Gallito Luis...")
        try:
            html = self.fetch_url(self.FEED_URL)
            
            # Look for JSON-LD schema if present
            ld_matches = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>([\s\S]*?)</script>', html)
            for ld in ld_matches:
                try:
                    data = json.loads(ld.strip())
                    if isinstance(data, dict) and data.get("@type") == "JobPosting":
                        jobs.append(self._parse_job_posting_schema(data))
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get("@type") == "JobPosting":
                                jobs.append(self._parse_job_posting_schema(item))
                except Exception:
                    pass

            # Fallback HTML cards extraction if Schema.org isn't embedded
            if not jobs:
                card_matches = re.findall(r'<a\s+href="(/empleos/[^"]+)"[^>]*>([\s\S]*?)</a>', html)
                seen_urls = set()
                for rel_url, inner in card_matches:
                    full_url = f"https://www.gallito.com.uy{rel_url}"
                    if full_url in seen_urls or "buscar" in rel_url:
                        continue
                    seen_urls.add(full_url)
                    clean_text = re.sub(r'<[^>]+>', ' ', inner).strip()
                    if len(clean_text) > 10 and not any(k in clean_text.lower() for k in ["siguiente", "anterior", "filtro"]):
                        jobs.append(JobPost(
                            company="Empresa vía Gallito Luis",
                            title=clean_text[:80],
                            apply_url=full_url,
                            description=f"Publicación en Gallito Luis Uruguay: {clean_text}.",
                            source_platform="gallito_luis",
                            source_priority=self.priority,
                            country=self.country,
                            location="Montevideo"
                        ))

            print(f"[+] [{self.name}] Gallito Luis: {len(jobs)} vacantes encontradas.")
        except Exception as e:
            print(f"[-] [{self.name}] Error consultando Gallito Luis: {e}")

        return jobs

    def _parse_job_posting_schema(self, data: dict) -> JobPost:
        hiring_org = data.get("hiringOrganization") or {}
        company = hiring_org.get("name") if isinstance(hiring_org, dict) else "Empresa Destacada"
        title = data.get("title", "Oportunidad Laboral")
        desc = data.get("description", "")
        url = data.get("url") or self.FEED_URL
        return JobPost(
            company=company,
            title=title,
            apply_url=url,
            description=desc,
            source_platform="gallito_luis",
            source_priority=self.priority,
            country=self.country,
            location="Montevideo"
        )
