import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data)
            cv_text = body.get('cv_text', '')
            
            if not cv_text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No cv_text provided'}).encode('utf-8'))
                return

            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'GEMINI_API_KEY not configured'}).encode('utf-8'))
                return

            # Prepare the prompt
            prompt = f"""
Actúa como un experto reclutador y agente de búsqueda de empleo en Uruguay.
Analiza el siguiente CV y extrae el perfil del candidato.
Luego, genera exactamente 3 consultas de búsqueda (search queries) optimizadas para buscar ofertas laborales recientes y relevantes para este candidato en sitios web de empleo (ej. LinkedIn, Computrabajo, Buscojobs).

El candidato es de Uruguay. Las consultas deben estar enfocadas en Uruguay o remoto.
Devuelve el resultado ÚNICAMENTE en este formato JSON válido, sin Markdown extra:
{{
  "profile_summary": "Resumen de 2 líneas del perfil",
  "queries": [
    "consulta 1",
    "consulta 2",
    "consulta 3"
  ]
}}

CV del candidato:
{cv_text[:3000]}
"""

            # Call Gemini API
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            gemini_payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
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
                
                # Ensure it's valid JSON
                parsed_response = json.loads(text_response)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(parsed_response).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
