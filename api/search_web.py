import json
import urllib.request
from http.server import BaseHTTPRequestHandler
from bs4 import BeautifulSoup

def scrape_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'html.parser')
            # Extraer título y texto limpio
            title = soup.title.string if soup.title else url
            
            # Remover scripts y styles
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.extract()
                
            text = soup.get_text(separator=' ', strip=True)
            # Limitar a los primeros 3000 caracteres para no ahogar al LLM
            return title, text[:3000]
    except Exception as e:
        return None, None

import urllib.parse

def search_yahoo(query, max_results=3):
    url = "https://search.yahoo.com/search?p=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    results = []
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'html.parser')
            for div in soup.find_all('div', class_='algo'):
                title_a = div.find('h3', class_='title').find('a') if div.find('h3', class_='title') else None
                if title_a and title_a.get('href'):
                    results.append({
                        'href': title_a.get('href'),
                        'title': title_a.text,
                        'body': div.text
                    })
                if len(results) >= max_results:
                    break
    except Exception:
        pass
    return results

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data)
            queries = body.get('queries', [])
            
            if not queries:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No queries provided'}).encode('utf-8'))
                return

            all_results = []
            seen_urls = set()

            for query in queries:
                # Remotive API es gratuita, abierta y no bloquea IPs de Vercel
                q_str = urllib.parse.quote(query.split()[0]) # Buscar solo por la primer palabra clave principal para no ser tan estricto
                url = f"https://remotive.com/api/remote-jobs?search={q_str}&limit=5"
                
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': 'JobCopilot/1.0'})
                    with urllib.request.urlopen(req, timeout=8) as response:
                        data = json.loads(response.read().decode('utf-8'))
                        jobs = data.get('jobs', [])
                        for job in jobs[:4]: # Tomar hasta 4 por query
                            j_url = job.get('url')
                            if j_url and j_url not in seen_urls:
                                seen_urls.add(j_url)
                                # Limpiar el HTML description
                                raw_desc = job.get('description', '')
                                soup = BeautifulSoup(raw_desc, 'html.parser')
                                clean_text = soup.get_text(separator=' ', strip=True)
                                
                                all_results.append({
                                    'url': j_url,
                                    'title': f"{job.get('title')} en {job.get('company_name')}",
                                    'snippet': clean_text[:200],
                                    'content': clean_text[:3000]
                                })
                except Exception:
                    pass

                if len(all_results) >= 10:
                    break

            if not all_results:
                return self.send_error_json("La búsqueda en portales abiertos (Remotive) no arrojó resultados para esos términos. Intente con habilidades más amplias en su CV.")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'results': all_results}).encode('utf-8'))

        except Exception as e:
            self.send_error_json(str(e))

    def send_error_json(self, msg):
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': msg}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
