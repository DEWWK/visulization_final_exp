// @ts-ignore
import { Control, Fullscreen, RasterLayer, Scene, PointLayer, LayerPopup, LayerSwitch, GaodeMap, LineLayer, HeatmapLayer, Scale, Zoom, MouseLocation } from '@antv/l7';
// @ts-ignore
import { Map } from '@antv/l7-maps';
import { csvParse } from 'd3-dsv';

const scene = new Scene({
  id: 'map',
  logoVisible: false,
  map: new GaodeMap({
    style: 'light',
    center: [118.07, 36.08],
    zoom: 6.5,
    token: 'bf558cc7441c4179aa812127b384a520',
    plugin: [],
  }),
});

const url1 =
  'https://tiles{1-3}.geovisearth.com/base/v1/img/{z}/{x}/{y}?format=webp&tmsIds=w&token=b2a0cfc132cd60b61391b9dd63c15711eadb9b38a9943e3f98160d5710aef788';
const url2 =
  'https://tiles{1-3}.geovisearth.com/base/v1/cia/{z}/{x}/{y}?format=png&tmsIds=w&token=b2a0cfc132cd60b61391b9dd63c15711eadb9b38a9943e3f98160d5710aef788';

const map_img = document.createElement('img');
map_img.src = '/picture/卫星地图.png'; // 设置图标路径
map_img.width = 32; // 设置宽度为 32 像素
map_img.height = 32; // 设置高度为 32 像素

const tem_img = document.createElement('img');
tem_img.src = '/picture/温度.png'; // 设置图标路径
tem_img.width = 32; // 设置宽度为 32 像素
tem_img.height = 32; // 设置高度为 32 像素

const city_img = document.createElement('img');
city_img.src = '/picture/城市点.png'; // 设置图标路径
city_img.width = 32; // 设置宽度为 32 像素
city_img.height = 32; // 设置高度为 32 像素

const weather_img = document.createElement('img');
weather_img.src = '/picture/天气.png'; // 设置图标路径
weather_img.width = 32; // 设置宽度为 32 像素
weather_img.height = 32; // 设置高度为 32 像素

const wind_img = document.createElement('img');
wind_img.src = '/picture/风流场.png'; // 设置图标路径
wind_img.width = 32; // 设置宽度为 32 像素
wind_img.height = 32; // 设置高度为 32 像素

const aqi_img = document.createElement('img');
aqi_img.src = '/picture/空气污染.png'; // 设置图标路径
aqi_img.width = 32; // 设置宽度为 32 像素
aqi_img.height = 32; // 设置高度为 32 像素

const hum_img = document.createElement('img');
hum_img.src = '/picture/湿度.png'; // 设置图标路径
hum_img.width = 32; // 设置宽度为 32 像素
hum_img.height = 32; // 设置高度为 32 像素

scene.on('loaded', () => {
  /*----------------------------------卫星图层---------------------------------*/
  const layer_stell = new RasterLayer({
    zIndex: 1,
    name: '卫星图',
    visible: false,
  }).source(url1, {
    parser: {
      type: 'rasterTile',
      tileSize: 256,
    },
  });
  /*----------------------------------卫星图层图例---------------------------------*/
  const layer_symbol = new RasterLayer({
    zIndex: 2,
    name: '卫星图图例',
    visible: false,
  }).source(url2, {
    parser: {
      type: 'rasterTile',
      tileSize: 256,
      minZoom: 12,
      maxZoom: 18,
    },
  });
  const layerswitch_stell = new LayerSwitch({
    layers: [layer_stell, layer_symbol],
    btnIcon: map_img, // 传递 DOM 节点
    position: 'topleft',
  });
  scene.addLayer(layer_stell);
  scene.addLayer(layer_symbol);
  scene.addControl(layerswitch_stell);

  /*----------------------------------城市边界---------------------------------*/
  fetch('https://geo.datav.aliyun.com/areas_v3/bound/370000_full.json')
    .then((res) => res.json())
    .then((data) => {
      const bound_layer = new LineLayer({ zIndex: 1, visible: true, }).source(data).size(40).shape('wall').style({
        opacity: 1,
        sourceColor: '#000000',
        targetColor: 'rbga(255,255,255, 0)',
      });
      scene.addLayer(bound_layer);
    });

  //天气图标
  scene.addImage(
    '晴天',
    '/picture/晴天.png',
  );
  scene.addImage(
    '多云',
    '/picture/多云.png',
  );
  scene.addImage(
    '轻度雾霾',
    '/picture/轻度雾霾.png',
  );
  scene.addImage(
    '中度雾霾',
    '/picture/中度雾霾.png',
  );
  scene.addImage(
    '重度雾霾',
    '/picture/重度雾霾.png',
  );
  scene.addImage(
    '雾',
    '/picture/雾.png',
  );
  scene.addImage(
    '小雨',
    '/picture/小雨.png',
  );
  scene.addImage(
    '中雨',
    '/picture/中雨.png',
  );
  scene.addImage(
    '大雨',
    '/picture/大雨.png',
  );
  scene.addImage(
    '小雪',
    '/picture/小雪.png',
  );
  scene.addImage(
    '中雪',
    '/picture/中雪.png',
  );
  scene.addImage(
    '大雪',
    '/picture/大雪.png',
  );
  scene.addImage(
    '暴雨',
    '/picture/暴雨.png',
  );
  scene.addImage(
    '暴雪',
    '/picture/暴雪.png',
  );
  scene.addImage(
    '沙尘',
    '/picture/沙尘.png',
  );
  scene.addImage(
    '风',
    '/picture/风.png',
  );
  scene.addImage(
    '雷阵雨',
    '/picture/雷阵雨.png',
  );
  scene.addImage(
    '阴天',
    '/picture/阴天.png',
  );
  scene.addImage(
    '雨夹雪',
    '/picture/雨夹雪.png',
  );
  /*----------------------------------城市数据源---------------------------------*/
  fetch('/data/city_inf.csv')
    .then((res) => res.text())
    .then((data) => {
      /*----------------------------------城市点图---------------------------------*/
      var layer_point = new PointLayer({
        zIndex: 3,
        name: '城市点图',
      })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'lng',
            y: 'lat',
          }
        })
        .shape('simple')
        .size(10)
        .color('#99ccff');

      layer_point.on('click', (e) => {
        const { lng, lat } = e.lngLat; // 点击点的经纬度
        let nearestPoint = null; // 最近点
        let minDistance = Infinity; // 最小距离

        // 假设图层数据是一个数组，包含所有点的经纬度
        const points = [
          { lng: 117.00, lat: 36.65 },
          { lng: 120.33, lat: 36.07 },
          { lng: 118.05, lat: 36.78 },
          { lng: 117.57, lat: 34.86 },
          { lng: 118.49, lat: 37.46 },
          { lng: 121.39, lat: 37.52 },
          { lng: 119.10, lat: 36.62 },
          { lng: 116.59, lat: 35.38 },
          { lng: 117.13, lat: 36.18 },
          { lng: 122.10, lat: 37.51 },
          { lng: 119.46, lat: 35.42 },
          { lng: 118.03, lat: 37.36 },
          { lng: 116.29, lat: 37.45 },
          { lng: 115.97, lat: 36.45 },
          { lng: 118.35, lat: 35.05 },
          { lng: 115.43, lat: 35.24 }
        ]; // 替换为你的图层数据

        // 遍历所有点，找到最近的点
        points.forEach(point => {
          const distance = Math.max(point.lng, lng) - Math.min(point.lng, lng) + Math.max(point.lat, lat) - Math.min(point.lat, lat);
          if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = point;
          }
        });

        if (nearestPoint) {
          // 将最近点设置为地图中心
          scene.setCenter([nearestPoint.lng, nearestPoint.lat], {
            padding: {
              right: 120,
            },
          });
          const outputElement = document.getElementById('coordinates');
          if (outputElement) {
            outputElement.innerHTML = `Longitude: ${nearestPoint.lng},Latitude:${nearestPoint.lat}`;
          }
        }
      });
      layer_point.on('unclick', () => {
        const outputElement = document.getElementById('coordinates');
        outputElement.innerHTML = `NULL`;
        scene.setCenter([120.688292, 36.365274], {
          padding: {
            right: 0,
          },
        });
      });
      const layerPopup_city = new LayerPopup({
        items: [
          {
            layer: layer_point,
            fields: [
              {
                field: 'city',
                formatField: () => '城市名',
              },
              {
                field: 'temperature',
                formatField: () => '温度',
              },
              {
                field: 'skycon',
                formatField: () => '天气',
              },
              {
                field: 'wind_direction2',
                formatField: () => '风向',
              },
              {
                field: 'wind_speed',
                formatField: () => '风速',
              },
              {
                field: 'humidity',
                formatField: () => '湿度',
              },
              {
                field: 'pm25',
                formatField: () => 'pm2.5浓度',
              },
              {
                field: 'aqi',
                formatField: () => '空气质量',
              },
              {
                field: 'aircondition',
                formatField: () => '空气质量',
              },
            ],
          },
        ],
        trigger: 'hover',
      });
      scene.addLayer(layer_point);
      scene.addPopup(layerPopup_city);
      const layerswitch_point = new LayerSwitch({
        layers: [layer_point],
        btnIcon: city_img,
        position: 'topleft',
      });
      scene.addControl(layerswitch_point);

      /*----------------------------------城市天气---------------------------------*/
      const imageLayer = new PointLayer({ name: '天气图标', zIndex: 4, })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'lng',
            y: 'lat',
          },
        })
        .shape('skycon', function (skycon) {
          return skycon;
        })
        .size(15);
      scene.addLayer(imageLayer);
      const switch1 = new LayerSwitch({ layers: [imageLayer], btnIcon: weather_img, position: 'topleft', });
      scene.addControl(switch1);
    });

  /*------------------------------------经纬度数据源---------------------------------*/
  fetch('/data/data.csv')
    .then((res) => res.text())
    .then((data) => {
      /*----------------------------------温度热力图---------------------------------*/
      const tem_layer = new HeatmapLayer({ name: '温度', zIndex: 3, visible: false, })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'lng',
            y: 'lat',
          },
          transforms: [
            {
              type: 'grid',
              size: 350,
              field: 'temperature',
              method: 'sum',
            },
          ],
        })
        .shape('square')
        .style({
          opacity: 0.5,
          coverage: 50,
          angle: 0,
        })
        .color(
          'sum',
          ['#ffff66',
            '#ffffcc',
            '#6BD5A0',
            '#afe9cc',
            '#3399ff',].reverse()
        );
      scene.addLayer(tem_layer);

      const tem_switch = new LayerSwitch({ layers: [tem_layer], btnIcon: tem_img, position: 'topleft', });
      scene.addControl(tem_switch);

      /*----------------------------------湿度热力图---------------------------------*/
      const hum_layer = new HeatmapLayer({ name: '湿度', zIndex: 3, visible: false, })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'lng',
            y: 'lat',
          },
          transforms: [
            {
              type: 'grid',
              size: 350,
              field: 'humidity',
              method: 'sum',
            },
          ],
        })
        .shape('square')
        .style({
          opacity: 0.6,
          coverage: 50,
          angle: 0,
        })
        .color(
          'sum',
          [
            '#b3d9ff',
            '#99ccff',
            '#80bfff',
            '#66b3ff',
            '#3399ff',
          ].reverse(),
        );
      scene.addLayer(hum_layer);
      const hum_switch = new LayerSwitch({ layers: [hum_layer], btnIcon: hum_img, position: 'topleft', });
      scene.addControl(hum_switch);

      /*----------------------------------空气污染热力图---------------------------------*/
      const aqi_layer = new HeatmapLayer({ name: '空气污染', zIndex: 3, visible: false, })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'lng',
            y: 'lat',
          },
          transforms: [
            {
              type: 'grid',
              size: 350,
              field: 'aqi',
              method: 'sum',
            },
          ],
        })
        .shape('square')
        .style({
          opacity: 0.7,
          coverage: 50,
          angle: 0,
        })
        .color(
          'sum',
          [
            '#3d3d29',
            '#6b6b47',
            '#999966',
            '#adad85',
            '#e0e0d1',
          ].reverse(),
        );
      scene.addLayer(aqi_layer);
      const aqi_switch = new LayerSwitch({ layers: [aqi_layer], btnIcon: aqi_img, position: 'topleft', });
      scene.addControl(aqi_switch);

      /*----------------------------------风流场---------------------------------*/
      const wind_line_layer = new LineLayer({ blend: 'normal', name: '风流场', zIndex: 3, visible: false, })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'start_lng',
            y: 'start_lat',
            x1: 'end_lng',
            y1: 'end_lat',
          },
        })
        .size(1.5)
        .shape('arc')
        .color('wind_speed', ['#66ccff', '#3399ff', '#0066ff'])
        .animate({
          duration: 4,
          interval: 0.2,
          trailLength: 0.4,
        });
      scene.addLayer(wind_line_layer);

      /*----------------------------------风力热力图---------------------------------*/
      const wind_force_layer = new HeatmapLayer({ name: '风力', zIndex: 3, visible: false, })
        .source(data, {
          parser: {
            type: 'csv',
            x: 'lng',
            y: 'lat',
          },
          transforms: [
            {
              type: 'grid',
              size: 350,
              field: 'wind_speed',
              method: 'sum',
            },
          ],
        })
        .shape('square')
        .style({
          opacity: 0.5,
          coverage: 50,
          angle: 0,
        })
        .color(
          'sum',
          [
            '#e6f2ff',
            '#b3d9ff',
            '#80bfff',
            '#0066cc',
            '#004d99',
          ]
        );
      scene.addLayer(wind_force_layer);
      const wind_switch = new LayerSwitch({
        layers: [wind_line_layer, wind_force_layer],
        btnIcon: wind_img,
        position: 'topleft',
      });
      scene.addControl(wind_switch);
    });

  /*----------------------------------功能控件---------------------------------*/
  const scale = new Scale();
  scene.addControl(scale);
  const zoom = new Zoom();
  scene.addControl(zoom);
  const mouseLocation = new MouseLocation({
    position: 'bottomright',
  });
  scene.addControl(mouseLocation);
  const fullscreen = new Fullscreen();
  scene.addControl(fullscreen);
});