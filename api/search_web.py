import json
import urllib.request
from http.server import BaseHTTPRequestHandler
from duckduckgo_search import DDGS
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

            with DDGS() as ddgs:
                for query in queries:
                    q_str = query + " (Uruguay OR remoto)"
                    results = []
                    try:
                        results = list(ddgs.text(q_str, backend="lite", max_results=3))
                        if not results:
                            results = list(ddgs.text(q_str, backend="api", max_results=3))
                    except Exception:
                        pass
                    
                    if not results:
                        # Fallback a Yahoo si DuckDuckGo nos bloqueó (Vercel IP)
                        results = search_yahoo(q_str, max_results=3)
                    
                    for r in results:
                        url = r.get('href')
                        if url and url not in seen_urls:
                            seen_urls.add(url)
                            title, text = scrape_url(url)
                            if text and len(text) > 100:
                                all_results.append({
                                    'url': url,
                                    'title': title,
                                    'snippet': r.get('body', ''),
                                    'content': text
                                })
                                
                                # Si ya tenemos 5 resultados crudos, paramos para evitar timeouts en Vercel
                                if len(all_results) >= 5:
                                    break
                    if len(all_results) >= 5:
                        break

            if not all_results:
                # Si llegamos aca sin resultados, forzamos un error para ver qué pasó
                return self.send_error_json("DDG retornó 0 resultados para las consultas.")

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
