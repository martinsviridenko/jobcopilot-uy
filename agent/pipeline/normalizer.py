"""
JobCopilot Agent — Intelligent Normalizer, Domain Classifier & Hours Estimator
"""
import re
from typing import Tuple, List, Dict, Any
from agent.scrapers.base_scraper import JobPost

# 9 Professional Domain Taxonomies (Synchronized with matching-engine.js)
DOMAINS = {
    "DATA_BI": {
        "name": "Datos, BI & Analítica",
        "icon": "📊",
        "keywords": ["data", "datos", "bi", "business intelligence", "sql", "power bi", "tableau", "analítica", "analytics", "looker", "etl", "dax", "modelado", "ciencia de datos"],
        "critical_skills": ["sql", "power bi", "tableau", "python", "dax", "looker", "r", "modelado de datos", "etl", "data warehouse", "estadística", "visualización", "dashboards"]
    },
    "BUSINESS_ADMIN": {
        "name": "Negocios & Administración",
        "icon": "💼",
        "keywords": ["administración", "negocios", "gestión", "procesos", "business", "administrativo", "consultoría", "control de gestión", "facturación", "erp"],
        "critical_skills": ["facturación", "erp", "control de gestión", "flujo de caja", "gestión administrativa", "mejora de procesos", "organización", "sap", "relevamiento"]
    },
    "FINANCE_BANKING": {
        "name": "Finanzas, Banca & Contabilidad",
        "icon": "🏦",
        "keywords": ["finanzas", "financiero", "contable", "contabilidad", "banco", "banca", "auditoría", "tax", "impuestos", "crédito", "tesorería"],
        "critical_skills": ["contabilidad", "conciliaciones", "niif", "impuestos", "tax", "auditoría contable", "asientos contables", "finanzas corporativas", "balance", "servicios bancarios"]
    },
    "MARKETING_ECOMM": {
        "name": "Marketing Digital & E-commerce",
        "icon": "🚀",
        "keywords": ["marketing", "e-commerce", "digital", "growth", "redes", "publicidad", "ads", "seo", "sem", "medios", "content", "ventas b2b"],
        "critical_skills": ["meta ads", "google ads", "seo", "sem", "e-commerce", "shopify", "growth marketing", "crm", "google analytics", "campañas", "ventas b2b"]
    },
    "HR_PEOPLE": {
        "name": "Gestión Humana & People",
        "icon": "👥",
        "keywords": ["rrhh", "recursos humanos", "people", "talento", "reclutamiento", "selección", "gestión humana", "nómina"],
        "critical_skills": ["reclutamiento", "selección", "gestión humana", "people analytics", "nómina", "evaluación de desempeño", "clima laboral"]
    },
    "IT_SUPPORT_INFRA": {
        "name": "Soporte TI & Infraestructura",
        "icon": "🛠️",
        "keywords": ["soporte", "it", "ti", "infraestructura", "redes", "help desk", "mesa de ayuda", "hardware", "técnico", "servidores", "sysadmin", "linux"],
        "critical_skills": ["linux", "redes", "cisco", "hardware", "active directory", "soporte técnico", "help desk", "mesa de ayuda", "tcp/ip", "antivirus", "mantenimiento"]
    },
    "SOFTWARE_DEV": {
        "name": "Desarrollo de Software",
        "icon": "💻",
        "keywords": ["developer", "software", "programador", "backend", "frontend", "fullstack", "desarrollo", "código", "dev", "programación"],
        "critical_skills": ["javascript", "react", "node", "java", "c#", ".net", "python dev", "git", "apis", "backend", "frontend", "docker", "typescript"]
    },
    "CYBERSECURITY": {
        "name": "Ciberseguridad & Auditoría IT",
        "icon": "🔒",
        "keywords": ["ciberseguridad", "seguridad de la información", "auditoría it", "iso 27001", "vulnerabilidades", "pentesting", "infosec", "soc"],
        "critical_skills": ["ciberseguridad", "firewalls", "iso 27001", "pentesting", "vulnerabilidades", "seguridad de la información", "soc", "siem", "auditoría de sistemas"]
    },
    "OPERATIONS_LOG": {
        "name": "Operaciones & Logística",
        "icon": "📦",
        "keywords": ["operaciones", "logística", "comercio exterior", "supply chain", "cadena de suministro", "depósito", "despacho", "stock", "comex", "customer experience"],
        "critical_skills": ["comercio exterior", "logística", "cadena de suministro", "aduana", "stock", "inventario", "despacho", "importaciones", "customer experience"]
    }
}

TRANSVERSAL_SKILLS = ["excel", "inglés", "ingles", "office", "word", "powerpoint", "comunicación", "comunicacion", "trabajo en equipo", "proactividad"]

def has_word(text: str, word: str) -> bool:
    """Exact token boundary matching to avoid substring false positives."""
    if not text or not word:
        return False
    t = " " + re.sub(r'[^a-záéíóúüñ0-9_+#-]', ' ', text.lower()) + " "
    k = " " + word.lower().strip() + " "
    return k in t

def clean_html(raw_html: str) -> str:
    """Strip HTML tags and clean up whitespace."""
    if not raw_html:
        return ""
    text = re.sub(r'<[^>]+>', ' ', raw_html)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def detect_hours(title: str, desc: str, company: str = "") -> Tuple[str, str, bool]:
    """
    Detects working hours with explicit keyword matching or contextual estimation.
    Returns: (hours_key, hours_label, is_estimated)
    """
    text = f"{title} {desc}".lower()

    # 1. EXPLICIT 4 HOURS / PART-TIME
    if any(k in text for k in [
        "4 horas", "4h", "4 hs", "part-time 20", "20 horas", "20 hs",
        "pasantía 4", "pasantia 4", "4 horas diarias", "cuatro horas"
    ]):
        return "4h", "4 horas diarias (Part-time)", False

    # 2. EXPLICIT 6 HOURS / MEDIA JORNADA / BANCA
    if any(k in text for k in [
        "6 horas", "6h", "6 hs", "30 horas", "30 hs", "jornada bancaria",
        "medio turno", "media jornada", "seis horas", "part-time 30", "6 horas diarias"
    ]):
        return "6h", "6 horas diarias (Medio turno)", False

    # 3. EXPLICIT 8 HOURS / FULL TIME
    if any(k in text for k in [
        "8 horas", "8h", "8 hs", "40 horas", "44 horas", "tiempo completo",
        "full time", "full-time", "jornada completa", "ocho horas", "9 a 18"
    ]):
        return "8h", "8 horas (Tiempo Completo)", False

    # 4. CONTEXTUAL / HEURISTIC ESTIMATION
    # Pasantías estudiantiles suelen ser de 4 o 6 horas en Uruguay
    if any(k in text for k in ["pasantía", "pasantia", "estudiante universitario", "becario", "student worker", "trainee"]):
        if any(b in company.lower() for b in ["banco", "itau", "santander", "bbva", "scotiabank", "brou"]):
            return "6h", "6 horas (Estimado: Jornada bancaria estudiante)", True
        return "4h", "4 a 6 horas (Estimado: Régimen de pasantía)", True

    # Atención telefónica o comercial bancaria sin horas explícitas
    if any(b in company.lower() for b in ["banco", "itau", "santander", "heritage", "brou"]):
        return "6h", "6 horas (Estimado: Convenio AEBU bancario)", True

    # Roles ejecutivos, analistas senior o desarrolladores backend -> 8h estimado
    return "8h", "8 horas (Estimado: Jornada completa habitual)", True

def detect_modality(desc: str) -> Tuple[str, str]:
    """Returns (modality_label, modality_key)"""
    text = desc.lower()
    if any(k in text for k in ["remoto", "remote", "100% home office", "teletrabajo"]):
        return "Remoto", "remote"
    if any(k in text for k in ["híbrido", "hibrido", "hybrid", "flexible", "home office"]):
        return "Híbrido", "hybrid"
    return "Presencial", "presential"

def detect_seniority(title: str, desc: str) -> str:
    """Returns seniority tier: Trainee, Junior, Semi-Senior, Senior"""
    text = f"{title} {desc}".lower()
    if any(k in text for k in ["trainee", "pasante", "pasantía", "pasantia", "estudiante", "practicante"]):
        return "Trainee"
    if any(k in text for k in ["senior", "sr.", "sr ", "lead", "gerente", "líder"]):
        return "Senior"
    if any(k in text for k in ["semi senior", "ssr", "semi-senior"]):
        return "Semi-Senior"
    return "Junior"

def detect_domain(title: str, desc: str, sector: str = "") -> Tuple[str, str, List[str]]:
    """
    Classifies the role into one of the 9 professional domains and extracts critical skills.
    Returns: (domain_key, domain_label, critical_skills)
    """
    text = f"{title} {desc} {sector}".lower()
    best_dom = "BUSINESS_ADMIN"
    best_score = -1

    for dom_key, dom_obj in DOMAINS.items():
        score = 0
        for kw in dom_obj["keywords"]:
            if has_word(text, kw):
                score += (6 if kw in title.lower() else 2)
        for cs in dom_obj["critical_skills"]:
            if has_word(text, cs):
                score += 3
        if score > best_score:
            best_score = score
            best_dom = dom_key

    # Extract detected critical skills
    detected_critical = []
    for cs in DOMAINS[best_dom]["critical_skills"]:
        if has_word(text, cs):
            detected_critical.append(cs)

    return best_dom, DOMAINS[best_dom]["name"], detected_critical

def detect_sector(company: str, title: str, domain: str) -> Tuple[str, str]:
    """Maps to broad UI sector category."""
    text = f"{company} {title}".lower()
    if any(k in text for k in ["banco", "itau", "santander", "cash", "financ", "banca", "aebu"]):
        return "bank", "Banca, Finanzas & Crédito"
    if any(k in text for k in ["cpa", "pwc", "ey", "deloitte", "kpmg", "advice", "consult", "prota", "manpower"]):
        return "consulting", "Consultoría & Procesos"
    if any(k in text for k in ["tech", "software", "dlocal", "mercado libre", "meli", "pento", "quantik", "sistemas", "dev"]):
        return "tech", "Tecnología & Software"
    if any(k in text for k in ["farmashop", "bestseller", "retail", "supermercado", "consumo"]):
        return "retail", "Retail & Consumo Masivo"
    if domain in ["DATA_BI", "SOFTWARE_DEV"]:
        return "tech", "Tecnología & Analítica"
    return "consulting", "Administración & Servicios"

def normalize_job_post(raw_post: JobPost) -> JobPost:
    """
    Runs full enrichment pipeline on a JobPost object.
    """
    clean_desc = clean_html(raw_post.description)
    raw_post.description = clean_desc

    # Hours
    h_key, h_label, is_est = detect_hours(raw_post.title, clean_desc, raw_post.company)
    raw_post.hours = h_key
    raw_post.hours_label = h_label
    raw_post.is_hours_estimated = is_est

    # Modality
    mod_lbl, mod_k = detect_modality(clean_desc)
    raw_post.modality = mod_lbl
    raw_post.modality_key = mod_k

    # Seniority
    raw_post.seniority = detect_seniority(raw_post.title, clean_desc)

    # Domain & Critical Skills
    dom_k, dom_lbl, crit_skills = detect_domain(raw_post.title, clean_desc, raw_post.sector)
    raw_post.domain = dom_k
    raw_post.domain_label = dom_lbl
    if not raw_post.critical_skills:
        raw_post.critical_skills = crit_skills

    # Sector
    sec_k, sec_lbl = detect_sector(raw_post.company, raw_post.title, dom_k)
    raw_post.sector = sec_k
    raw_post.sector_label = sec_lbl

    # Career Fit Default
    if not raw_post.career_fit:
        if dom_k == "DATA_BI":
            raw_post.career_fit = ["Negocios Digitales", "Ciencia de Datos", "Estadística", "Sistemas", "Economía"]
        elif dom_k == "FINANCE_BANKING":
            raw_post.career_fit = ["Contabilidad", "Ciencias Económicas", "Administración", "Finanzas"]
        elif dom_k == "IT_SUPPORT_INFRA":
            raw_post.career_fit = ["Sistemas", "Redes & Telecomunicaciones", "Tecnología"]
        elif dom_k == "SOFTWARE_DEV":
            raw_post.career_fit = ["Ingeniería en Sistemas", "Computación", "Desarrollo de Software"]
        elif dom_k == "MARKETING_ECOMM":
            raw_post.career_fit = ["Marketing Digital", "Negocios Digitales", "Comunicación"]
        else:
            raw_post.career_fit = ["Administración", "Negocios Digitales", "Ciencias Económicas"]

    # Requirements structure
    if not raw_post.requirements or not raw_post.requirements.get("mandatory"):
        mandatory = [f"Disponibilidad {h_key}"]
        if raw_post.seniority in ["Trainee", "Junior"]:
            mandatory.append("Estudiante universitario o recién egresado")
        if crit_skills:
            mandatory.append(f"Conocimientos en {crit_skills[0].upper()}")
        
        desirable = []
        if len(crit_skills) > 1:
            desirable.append(f"Manejo de {crit_skills[1].upper()}")
        desirable.append("Manejo de herramientas informáticas (Excel/Office)")

        bonus = ["Nivel intermedio/avanzado de inglés"]
        raw_post.requirements = {
            "mandatory": mandatory,
            "desirable": desirable,
            "bonus": bonus
        }

    return raw_post
