from googlesearch import search

try:
    for url in search("site:linkedin.com/jobs/view 'analista' 'uruguay'", num_results=3):
        print("Found:", url)
except Exception as e:
    print("Error:", e)
