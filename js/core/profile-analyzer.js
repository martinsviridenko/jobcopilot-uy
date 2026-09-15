/**
 * JobCopilot v3 — Candidate Profile Analyzer (Candidate-First Ontology)
 */

class ProfileAnalyzer {
    static parse(rawText, existingProfile = null) {
        const text = (rawText || "").toLowerCase();
        
        let name = (existingProfile && existingProfile.name) || "Martín Sviridenko";
        let edu = (existingProfile && existingProfile.edu) || "Licenciatura en Negocios Digitales — Universidad ORT Uruguay (Estudiante)";
        let summary = (existingProfile && existingProfile.summary) || "Estudiante universitario en Negocios Digitales enfocado en Business Intelligence, SQL, Power BI, Excel avanzado y analítica comercial.";
        let lang = (existingProfile && existingProfile.lang) || "Cambridge B2 First";
        let skills = existingProfile && existingProfile.skills ? [...existingProfile.skills] : [
            "Excel", "Power BI", "SQL", "Python", "Meta Ads", "Análisis de Datos", "E-commerce", "Modelado de Datos"
        ];

        // Automatic career detection from raw text
        if (text.includes("negocios digitales")) {
            edu = "Licenciatura en Negocios Digitales — Universidad ORT Uruguay (Estudiante)";
        } else if (text.includes("administración") || text.includes("ciencias económicas")) {
            edu = "Ciencias Económicas y Administración (Estudiante)";
        }

        // Automatic English level detection
        if (text.includes("b2 first") || text.includes("first certificate")) {
            lang = "Cambridge B2 First";
        } else if (text.includes("c1") || text.includes("advanced")) {
            lang = "Avanzado / C1";
        }

        // Technical skills extraction
        const SKILLS_MAP = {
            "excel": "Excel Avanzado",
            "power bi": "Power BI",
            "sql": "SQL",
            "python": "Python (Data/Análisis)",
            "meta ads": "Meta Ads",
            "google ads": "Google Ads",
            "google analytics": "Google Analytics",
            "tableau": "Tableau",
            "dax": "DAX",
            "e-commerce": "E-commerce",
            "shopify": "Shopify",
            "crm": "CRM",
            "sap": "SAP (Nociones)"
        };

        for (const [key, label] of Object.entries(SKILLS_MAP)) {
            if (text.includes(key) && !skills.includes(label)) {
                skills.push(label);
            }
        }

        // Determine candidate ontological category & compatibility limits
        const careerCategory = "BUSINESS_DIGITAL_ANALYTICS";
        const primaryTargetDomains = [
            "DATA_ANALYTICS_BI",
            "BUSINESS_MANAGEMENT",
            "FINANCE_BANKING",
            "MARKETING_GROWTH",
            "CUSTOMER_OPERATIONS"
        ];

        // Degrees/specialties that are completely out of reach for this candidate
        const excludedCareerDegrees = [
            "ingeniería en computación", "ingenieria en computacion",
            "ingeniería de sistemas", "ingenieria de sistemas",
            "licenciatura en computación", "computer science",
            "psicología", "psicologia", "licenciatura en relaciones laborales",
            "medicina", "fonoaudiología", "fonoaudiologia", "enfermería",
            "ingeniería industrial mecánica", "ingeniero químico",
            "abogacía", "notariado", "magisterio", "profesorado"
        ];

        return {
            name,
            edu,
            summary,
            lang,
            skills,
            seniorityLevel: "Junior / Estudiante Universitario",
            careerCategory,
            primaryTargetDomains,
            excludedCareerDegrees,
            experienceYears: 1
        };
    }
}
