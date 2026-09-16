import urllib.request, urllib.parse
from bs4 import BeautifulSoup

def search_yahoo(query, max_results=3):
    url = "https://search.yahoo.com/search?p=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    results = []
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
    return results

print(search_yahoo("analista de datos uruguay"))
