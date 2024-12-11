const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

// 映射天气状态从英文到中文
const skyconMapping = {
  'CLEAR_DAY': '晴天',
  'CLEAR_NIGHT': '晴天',
  'PARTLY_CLOUDY_DAY': '多云',
  'PARTLY_CLOUDY_NIGHT': '多云',
  'CLOUDY': '阴天',
  'LIGHT_HAZE': '轻度雾霾',
  'MODERATE_HAZE': '中度雾霾',
  'HEAVY_HAZE': '重度雾霾',
  'LIGHT_RAIN': '小雨',
  'MODERATE_RAIN': '中雨',
  'HEAVY_RAIN': '大雨',
  'STORM_RAIN': '暴雨',
  'THUNDER_SHOWER': '雷阵雨',
  'LIGHT_SNOW': '小雪',
  'MODERATE_SNOW': '中雪',
  'HEAVY_SNOW': '大雪',
  'STORM_SNOW': '暴雪',
  'FOG': '雾',
  'DUST': '沙尘',
  'WIND': '风'
};

// 将风向角度转换为“北、东、南、西”的方位
function angleToWindDirection(angle) {
  if (angle >= 337.5 || angle < 22.5) {
    return '北';
  } else if (angle >= 22.5 && angle < 67.5) {
    return '东北';
  } else if (angle >= 67.5 && angle < 112.5) {
    return '东';
  } else if (angle >= 112.5 && angle < 157.5) {
    return '东南';
  } else if (angle >= 157.5 && angle < 202.5) {
    return '南';
  } else if (angle >= 202.5 && angle < 247.5) {
    return '西南';
  } else if (angle >= 247.5 && angle < 292.5) {
    return '西';
  } else if (angle >= 292.5 && angle < 337.5) {
    return '西北';
  }
  return '未知';  // 默认值
}


// 读取坐标文件
const coordinates = [];
fs.createReadStream('../public/data/city.csv')
  .pipe(csv())
  .on('data', (row) => {
    coordinates.push(row);
  })
  .on('end', () => {
    console.log('CSV文件读取完成');
    processCoordinates();
  });

// 模拟延时的函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 发起请求并处理响应数据
async function processCoordinates() {
  const results = [];
  const delay = 50;  // 每次请求后的延时

  const promises = coordinates.map(async (coordinate, i) => {
    const { lng, lat } = coordinate;
    const startTime = Date.now();

    try {
      const url = `https://api.caiyunapp.com/v2.6/Y2FpeXVuX25vdGlmeQ==/${lng},${lat}/hourly?hourlysteps=1`;
      const response = await axios.get(url);
      const result = response.data.result;

      if (!result || !result.hourly) {
        throw new Error('Missing "hourly" data in API response');
      }

      // 获取最新的时间段数据
      const latestTimeIndex = result.hourly.temperature.length - 1;

      const temperature = result.hourly.temperature[latestTimeIndex]?.value;  // 最新的温度数据
      const humidity = result.hourly.humidity[latestTimeIndex]?.value;  // 最新的湿度数据
      const windSpeed = result.hourly.wind[latestTimeIndex]?.speed || 'N/A';  // 最新的风速
      const windDirection = result.hourly.wind[latestTimeIndex]?.direction || 'N/A';  // 最新的风向
      const skycon = result.hourly.skycon[latestTimeIndex]?.value || 'N/A';  // 最新的天气情况
      const skyconInChinese = skyconMapping[skycon] || skycon;
      const windDirection2 = angleToWindDirection(windDirection);
      const pressure = result.hourly.pressure[latestTimeIndex]?.value;  // 最新的气压数据
      const apparent_temperature = result.hourly.apparent_temperature[latestTimeIndex]?.value;  // 最新的气压数据
      const pm25 = result.hourly.air_quality.pm25[latestTimeIndex]?.value || 'N/A';  // 最新的 PM2.5
      const aqi = result.hourly.air_quality.aqi[latestTimeIndex]?.value?.chn || 'N/A';  // 最新的 AQI（国标）
      const aircondition = aqi <= 50 ? '优' :
        aqi <= 100 ? '良' :
          aqi <= 150 ? '轻度污染' :
            aqi <= 200 ? '中度污染' :
              aqi <= 300 ? '重度污染' : '严重污染'; // 根据 AQI 分类生成空气质量描述

      const weather = {
        city: coordinate.city,
        lng: lng,
        lat: lat,
        temperature: temperature,
        humidity: humidity,
        skycon: skyconInChinese,
        wind_speed: windSpeed,
        wind_direction: windDirection,
        wind_direction2: windDirection2,
        pressure: pressure,
        apparent_temperature: apparent_temperature,
        pm25: pm25,
        aqi: aqi,
        aircondition: aircondition,
      };

      results.push(weather);
      console.log(`Processed data for ${lng}, ${lat}`);

    } catch (error) {
      console.error(`Error processing data for ${lng}, ${lat}: ${error}`);
    }

    const endTime = Date.now();
    console.log(`Request for ${lng}, ${lat} took ${endTime - startTime} ms`);

    // 每个请求后稍微延时，以避免请求过于频繁
    await sleep(delay);
  });

  // 使用 Promise.all 进行并行请求
  await Promise.all(promises);

  // 将结果写入 CSV 文件
  writeResults(results);
}




// 写入结果到results.csv
function writeResults(results) {
  const json2csvParser = new Parser();
  let csvData = json2csvParser.parse(results);

  csvData = csvData.replace(/"/g, '');

  fs.writeFile('../public/data/city_inf.csv', csvData, (err) => {
    if (err) throw err;
    console.log('结果已保存到city_inf.csv');
  });
}
