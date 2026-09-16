import json
import os
import urllib.request
import hashlib
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data)
            cv_text = body.get('cv_text', '')
            job = body.get('job', {})
            
            if not cv_text or not job:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing cv_text or job'}).encode('utf-8'))
                return

            api_key = os.environ.get('GEMINI_API_KEY', '').strip()
            if not api_key:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'GEMINI_API_KEY not configured'}).encode('utf-8'))
                return

            prompt = f"""
Eres un reclutador experto evaluando si un candidato es apto para una oferta de empleo ESPECÍFICA obtenida de internet.
Compara el perfil del candidato con la vacante. No seas excesivamente estricto si es un rol junior/trainee, pero sí realista.

REGLAS DE SALIDA:
Devuelve ÚNICAMENTE un JSON válido con este esquema exacto, sin markdown extra:
{{
  "is_match": true/false,
  "score": 0 a 100,
  "company": "Nombre de la empresa (si se menciona) o 'Empresa Confidencial'",
  "title": "El título exacto del puesto",
  "justification": "Una oración explicando por qué es o no es un buen match",
  "modality": "Remoto/Presencial/Híbrido",
  "hours": "Full-time/Part-time"
}}

---
VACANTE (Extraída de {job.get('url')}):
{job.get('title')}
{job.get('content')[:2000]}

---
CV DEL CANDIDATO:
{cv_text[:2000]}
"""

            # Call Gemini API
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            gemini_payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "responseMimeType": "application/json"
                }
            }
            
            req = urllib.request.Request(
                gemini_url, 
                data=json.dumps(gemini_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                parsed = json.loads(text_response)

            # Enriquecer el JSON para el frontend
            parsed['url'] = job.get('url')
            parsed['id'] = hashlib.sha256(job.get('url', '').encode()).hexdigest()[:12]

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(parsed).encode('utf-8'))

        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f"HTTPError {e.code}: {err_body}"}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': repr(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
