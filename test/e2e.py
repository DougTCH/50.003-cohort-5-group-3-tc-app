import requests
import json
import os
import shutil
import random
import glob
import subprocess
import time
# Define the base URL
base_url = 'http://localhost:3000'

def login():
    login_url = f'{base_url}/auth/login'
    login_data = {
    "username": "user1",
    "password": "pass1",
    "appcode": "NATIONAL_BANKING"}
    login_headers = {
    'Content-Type': 'application/json'}
    # Send the login POST request to get the token
    login_response = requests.post(login_url, data=json.dumps(login_data), headers=login_headers)
    if login_response.status_code == 200:
        token = login_response.json().get('token')
        if not token:
            print("Failed to retrieve token")
        return token
            
    else:
        print(f"Login failed. Status code: {login_response.status_code}, Error: {login_response.json()}")
        return None

def add_transaction(transation_data,token):
    add_record_url = f'{base_url}/transact/add_record'
    add_record_headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'}
    # Send the add_record POST request
    add_record_response = requests.post(add_record_url, data=json.dumps(transation_data), headers=add_record_headers)
    if add_record_response.status_code == 200:
        print("Transaction added successfully:", add_record_response.json())
        t_id = add_record_response.json().get('t_id')
        return t_id
    else:
        print(f"Failed to add transaction. Status code: {add_record_response.status_code}, Error: {add_record_response.json()}")
        return None
    

def empty_accural_folder():
    folder_path = os.path.join(os.path.dirname(__file__), '..', 'AccrualFiles')
    try:
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        print("AccuralFiles folder emptied successfully.")
    except Exception as e:
        print(f"Failed to empty AccuralFiles folder. Error: {e}")

def empty_handback_folder():
    folder_path = os.path.join(os.path.dirname(__file__), '..', 'HandBackFiles')
    try:
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        print("HandBackFiles folder emptied successfully.")
    except Exception as e:
        print(f"Failed to empty HandBackFiles folder. Error: {e}")
        
def call_gen_acc():
    gen_acc_url = f'{base_url}/transact/gen_acc'
    response = requests.post(gen_acc_url)
    print("Gen Acc Response:", response.json())
    return response.json()

def run_tools1():
    users = []
    toks = {}
    with open("users.json") as u:
        users = json.loads(u.read())
    for u in users:
        payload = {'username':u['username'],'password':u['password'],'appcode':u['appcode']}
        res = requests.post(f"{base_url}/auth/login/",json=payload)
        _t = json.loads(res.text)
        toks[u['username']] = _t["token"]
    for u in users:
        headers = {
            "authorization":f"bearer {toks[u['username']]}"
        }
        print(u["valid_lp"][0], u["username"])
        payload = {
        "app_id": u["appcode"],
        "loyalty_pid": u["valid_lp"][0],
        "user_id": f"{u['username']}_id",
        "member_id": f"{u['username']}_m_id",
        "member_first": f"{u['member_first']}",
        "member_last":f"{u['member_last']}",
        "transaction_date": "20240808",
        "ref_num": f"{random.randint(100000,999999)}",
        "amount": 10000,
        "additional_info": {"email": "sngamos9@gmail.com", "hp": "999"}
        }
        res = requests.post(f"{base_url}/transact/add_record",json=payload,headers = headers)
        _t = json.loads(res.text)
        if(res.status_code!=200):
            print(f"{u['username']} payload transact fail - {res.status_code}")
    
def run_tools2():
    listing = glob.glob('../AccrualFiles/*')
    for l in listing:
        hbs = "transfer_date,amount,reference_number,outcome_code\n" 
        with open(l) as f:
            for ll in (f.read().split('\n'))[1::]:
                r = ll.split(',')
                if(len(r)>1):
                    hbs+=f"{r[4]},{r[5]},{r[6]},0000\n"

        with open(f"../HandBackFiles/{l[16::].replace('ACCRUAL','HANDBACK')}",'w+') as ff:
            ff.write(hbs)



def send_to_sftp():
    batch_file_path = os.path.join(os.path.dirname(__file__), '..', 'upload_files.bat')
    try:
        # Run the batch file
        result = subprocess.run([batch_file_path], check=True, shell=True, cwd=os.path.dirname(batch_file_path))
        print("SFTP transfer completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to transfer files via SFTP. Error: {e}")

def call_gen_hbf():
    gen_hbf_url = f'{base_url}/transact/gen_hbf'
    response = requests.post(gen_hbf_url)
    print("Gen HBF Response:", response.json())
    return response.json()

if __name__ == "__main__":
    print("=====Starting E2E Test=====")
    token = login()
    if token:
        ref_num = random.randint(100000, 999999)
        transaction_data = {
            "app_id": "NATIONAL_BANKING",
            "loyalty_pid": "JOYSPRING_TOYS",
            "user_id": "user1_id",
            "member_id": "user1_m_id",
            "member_first": "John",
            "member_last": "Doe",
            "transaction_date": "20240809",  # YYYYMMDD format
            "ref_num": str(ref_num),
            "amount": 10123,
            "additional_info": {"email": "sngamos9@gmail.com", "hp": "999"}
        }
        time.sleep(0.5)
        print("Adding transaction")
        add_transaction(transaction_data, token)
        time.sleep(0.5)
        print("Cleaning accural folder")
        empty_accural_folder()
        time.sleep(0.5)
        print("Cleaning handback folder")
        empty_handback_folder()
        time.sleep(0.5)
        print("run tools 1")
        run_tools1()
        time.sleep(0.5)
        print("Calling gen_acc")
        call_gen_acc()
        time.sleep(0.5)
        print("Running tools to gen hbf")
        run_tools2()
        time.sleep(0.5)
        print("Sending files to SFTP")
        send_to_sftp()
        print("Waiting 15 seconds for SFTP server")
        time.sleep(15)
        print("Calling gen_hbf")
        call_gen_hbf()
        print("=====E2E Test Completed=====")

