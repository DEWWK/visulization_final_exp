import requests
import json
import csv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS  # 导入CORS

# 初始化Flask应用
app = Flask(__name__)

# 启用CORS，允许跨域访问
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# OpenAI API的URL
url = "https://api.mixrai.com/v1/chat/completions"
api_key = "sk-LlL4FITM7oX0OpoOD5B3C69eAc6e46548f649606Ac196109"

# 读取CSV文件的函数
def read_city_inf():
    city_info = ""
    try:
        # 打开并读取 city_inf.csv 文件
        with open('../public/data/city_inf.csv', newline='', encoding='utf-8') as csvfile:
            csvreader = csv.reader(csvfile)
            # 跳过表头
            next(csvreader)
            # 遍历CSV中的每一行
            for row in csvreader:
                city_info += f"City: {row[0]}, Temperature: {row[3]}, Weather: {row[5]},humidity:{row[4]},\n"
    
    except Exception as e:
        city_info = f"Error reading CSV: {str(e)}"
    print(city_info)
    return city_info

@app.route('/get_weather_advice', methods=['POST', 'OPTIONS'])
def get_weather_advice():
    if request.method == 'OPTIONS':
        # 构建 CORS 允许的响应
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200

    # 从POST请求中获取字符串数据
    user_request = request.data.decode('utf-8')  # 获取传递的纯文本字符串
    # 获取从CSV文件读取的城市信息
    city_info = read_city_inf()

    # 将前端传来的字符串与CSV信息拼接
    user_message = (
        f"The user has made the following request: {user_request}\n"
        f"Here is the city information:\n{city_info}\n"
        "Please state what residents should pay attention to based on the above information. Provide a brief overview within 70 words."
    )

    # 准备请求体
    payload = json.dumps({
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": user_message}]
    })

    # 设置请求头，包含Bearer Token进行授权
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # 向OpenAI API发送POST请求
    response = requests.post(url, headers=headers, data=payload)

    # 检查API响应
    if response.status_code == 200:
        result = response.json()
        content = result['choices'][0]['message']['content']
        # print(content)
        return jsonify({"advice": content}), 200
    else:
        return jsonify({"error": "Failed to get advice from API"}), 500

# 启动Flask应用
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # 允许所有IP访问
