import requests
from settings import HOST

def admin_auth():
    data = {
        'username': 'admin',
        'password': 'admin',
        'chat_id': 1
    }

    response = requests.post(f'{HOST}/api/v1/token/', data=data)
    
    if response.status_code == 200:
        tokens = response.json()
        access_token = tokens['access']
        print("Успешно авторизовано!")
        return access_token
    else:
        print("Ошибка авторизации:", response.status_code, response.text)
        exit()