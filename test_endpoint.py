import requests
import json

url = "http://localhost:8000/registros/completo/"
params = {
    "cooperativa_nombre": "CAJA COOPERATIVA CREDICOOP",
    "year": 2021
}

print(f"URL: {url}")
print(f"Params: {params}")
print()

try:
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Éxito - {len(data)} registros obtenidos")
        if data:
            print("Primer registro:")
            print(json.dumps(data[0], indent=2))
    else:
        print(f"❌ Error {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
