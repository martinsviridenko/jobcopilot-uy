"""
JobCopilot Agent — Scraper Registry & Factory
"""
from typing import List, Dict, Type
from agent.scrapers.base_scraper import BaseScraper
from agent.scrapers.teamtailor_scraper import TeamtailorScraper
from agent.scrapers.greenhouse_scraper import GreenhouseScraper
from agent.scrapers.smarttalent_scraper import SmartTalentScraper
from agent.scrapers.linkedin_scraper import LinkedInGuestScraper
from agent.scrapers.gallito_scraper import GallitoScraper
from agent.scrapers.buscojobs_scraper import BuscoJobsScraper
from agent.scrapers.advice_scraper import AdviceScraper
from agent.scrapers.workday_scraper import WorkdayScraper

AVAILABLE_SCRAPERS: Dict[str, Type[BaseScraper]] = {
    "teamtailor": TeamtailorScraper,
    "greenhouse": GreenhouseScraper,
    "workday": WorkdayScraper,
    "smarttalent": SmartTalentScraper,
    "linkedin": LinkedInGuestScraper,
    "advice": AdviceScraper,
    "buscojobs": BuscoJobsScraper,
    "gallito": GallitoScraper,
}

def get_scrapers(country: str = "UY", enabled_names: List[str] = None) -> List[BaseScraper]:
    """Instantiates enabled scrapers for the requested country."""
    scrapers = []
    names = enabled_names or list(AVAILABLE_SCRAPERS.keys())
    for name in names:
        cls = AVAILABLE_SCRAPERS.get(name)
        if cls:
            scrapers.append(cls(country=country))
    return scrapers
