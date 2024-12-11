import pandas as pd
import numpy as np
from pykrige.ok import OrdinaryKriging
import fiona
from shapely.geometry import Polygon, Point

# 读取city.csv文件
data = pd.read_csv('../public/data/city_inf.csv')

# 提取经度、纬度和温度数据
lng = data['lng'].values
lat = data['lat'].values
temperature = data['temperature'].values
wind_speed = data['wind_speed'].values
wind_direction = data['wind_direction'].values
humidity = data['humidity'].values
aqi = data['aqi'].values

# 创建克里金插值模型并对温度、风速、风向进行插值
OK_temp = OrdinaryKriging(lng, lat, temperature, variogram_model='gaussian', nlags=6)
OK_wind_speed = OrdinaryKriging(lng, lat, wind_speed, variogram_model='gaussian', nlags=6)
OK_wind_direction = OrdinaryKriging(lng, lat, wind_direction, variogram_model='gaussian', nlags=6)
OK_humidity = OrdinaryKriging(lng, lat, humidity, variogram_model='gaussian', nlags=6)
OK_aqi = OrdinaryKriging(lng, lat, aqi, variogram_model='gaussian', nlags=6)

# 减少网格分辨率，减少内存消耗
gridx = np.linspace(114.5, 122.5, 100)  # 在经度范围内生成更小的网格
gridy = np.linspace(34.2, 38.2, 50)  # 在纬度范围内生成更小的网格

# 执行克里金插值
z_temp, ss_temp = OK_temp.execute('grid', gridx, gridy)
z_wind_speed, ss_wind_speed = OK_wind_speed.execute('grid', gridx, gridy)
z_wind_direction, ss_wind_direction = OK_wind_direction.execute('grid', gridx, gridy)
z_humidity, ss_humidity = OK_humidity.execute('grid', gridx, gridy)
z_aqi, ss_aqi = OK_aqi.execute('grid', gridx, gridy)

gridx, gridy = np.meshgrid(gridx, gridy)

length_factor = 0.08

def calCor(lng, lat, wind_speed, wind_direction):
    length = wind_speed * length_factor

    angle = np.radians(wind_direction)

    delta_lng = length * np.sin(angle)
    delta_lat = length * np.cos(angle)

    start_lng = lng + delta_lng / 2
    start_lat = lat - delta_lat / 2
    end_lng = lng - delta_lng / 2
    end_lat = lat + delta_lat / 2

    return np.round(start_lng, 2), np.round(start_lat, 2), np.round(end_lng, 2), np.round(end_lat, 2)

shp = fiona.open('../shape/山东省.shp')
pol = shp.next()
polygon = Polygon(pol['geometry']['coordinates'][0][0])

results = pd.DataFrame({
    'lng': np.round(gridx.flatten(), 2),
    'lat': np.round(gridy.flatten(), 2),
    'temperature': np.round(z_temp.flatten(), 2),
    'wind_speed': np.round(z_wind_speed.flatten(), 2),
    'wind_direction': np.round(z_wind_direction.flatten(), 2),
    'humidity': np.round(z_humidity.flatten(), 2),
    'aqi': np.round(z_aqi.flatten(), 2)
})

results[['start_lng', 'start_lat', 'end_lng', 'end_lat']] = results.apply(
    lambda row: pd.Series(calCor(row['lng'], row['lat'], row['wind_speed'], row['wind_direction'])),
    axis=1
)

# 使用 apply 函数将不在多边形内的温度值设置为 np.nan
results = results[results.apply(lambda row: polygon.contains(Point(row['lng'], row['lat'])), axis=1)]

# 将结果写入results.csv
results.to_csv('../public/data/data.csv', index=False)

print("interdata complete!")
