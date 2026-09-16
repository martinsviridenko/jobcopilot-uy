import urllib.request, json

CV = "Soy Martín, estudiante de Licenciatura en Negocios Digitales en la ORT Uruguay. Busco trabajo part-time o pasantía en análisis de datos o business intelligence. Manejo Power BI, SQL y Excel. Tengo nivel de inglés intermedio. Vivo en Montevideo."
HOST = "https://jobcopilot-uy.vercel.app"

print("1. GENERATE QUERIES...")
req1 = urllib.request.Request(f"{HOST}/api/generate_queries", headers={'Content-Type': 'application/json'}, data=json.dumps({"cv_text": CV}).encode('utf-8'))
res1 = urllib.request.urlopen(req1).read().decode('utf-8')
q_data = json.loads(res1)
queries = q_data.get("queries", [])
print(f"Queries: {queries}")

print("2. SEARCH WEB...")
req2 = urllib.request.Request(f"{HOST}/api/search_web", headers={'Content-Type': 'application/json'}, data=json.dumps({"queries": queries}).encode('utf-8'))
res2 = urllib.request.urlopen(req2).read().decode('utf-8')
s_data = json.loads(res2)
jobs = s_data.get("results", [])
print(f"Found jobs: {len(jobs)}")
if jobs:
    print(f"First job: {jobs[0]['title']} - {jobs[0]['url']}")

print("3. EVALUATE MATCH...")
if jobs:
    req3 = urllib.request.Request(f"{HOST}/api/evaluate_match", headers={'Content-Type': 'application/json'}, data=json.dumps({"cv_text": CV, "job": jobs[0]}).encode('utf-8'))
    res3 = urllib.request.urlopen(req3).read().decode('utf-8')
    eval_data = json.loads(res3)
    print("EVAL RESULT:", json.dumps(eval_data, indent=2))
