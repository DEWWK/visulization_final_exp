const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const GDtoken = 'bf558cc7441c4179aa812127b384a520';

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
    const { lng, lat, adcode, city } = coordinate;
    const startTime = Date.now();

    try {
      let weather = {};  // 定义一个存储合并数据的对象
      // 获取高德API天气预报数据
      const forecastUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&key=0a5916a50ef2e001da884f990328cf01&extensions=all`;
      const forecastResponse = await axios.get(forecastUrl);
      const forecastData = forecastResponse.data.forecasts[0];

      if (forecastData && forecastData.casts && forecastData.casts.length > 0) {
        forecastData.casts.forEach((cast) => {
          const weatherForecast = {
            city: forecastData.city,
            lng: lng,
            lat: lat,
            adcode: forecastData.adcode,
            province: forecastData.province,
            date: cast.date,
            dayweather: cast.dayweather,
            nightweather: cast.nightweather,
            daytemp: cast.daytemp,
            nighttemp: cast.nighttemp,
            daywind: cast.daywind,
            nightwind: cast.nightwind,
            daypower: cast.daypower,
            nightpower: cast.nightpower
          };

          // 将 weather 和 weatherForecast 合并
          const combinedWeatherData = weatherForecast;
          results.push(combinedWeatherData);
        });
        // console.log(`Processed weather forecast data for ${forecastData.city}`);
      } else {
        console.error(`No forecast data available for adcode: ${adcode}`);
      }
    } catch (error) {
      console.error(`Error processing data for ${lng}, ${lat}: ${error}`);
    }

    const endTime = Date.now();
    // console.log(`Request for ${lng}, ${lat} took ${endTime - startTime} ms`);

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

  fs.writeFile('../public/data/city_inf_forecast.csv', csvData, (err) => {
    if (err) throw err;
    console.log('结果已保存到results_forecast.csv');
  });
}
