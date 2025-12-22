// Mapbox Access Token
mapboxgl.accessToken =
  'pk.eyJ1IjoiZGFmZ3QiLCJhIjoiY21pemt3MnByMHM2eTNkcHA0OHB6MzNtZSJ9.LVM0AlMbcmDDlrc5OVgFmg';

// 지도 초기화 - 커스텀 스타일
const map = new mapboxgl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#191b2e',
        },
      },
    ],
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  },
  center: [128.0, 36.0],
  zoom: 6,
  pitch: 0,
});

// 공통 지도 레이어(배경, 한반도) 추가 함수
async function addBaseLayers(mapInstance) {
  try {
    const [landResponse, koreaResponse] = await Promise.all([
      fetch(
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson'
      ),
      fetch(
        'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json'
      ),
    ]);

    if (!landResponse.ok || !koreaResponse.ok) {
      throw new Error('Failed to fetch map data');
    }

    const landData = await landResponse.json();
    const koreaData = await koreaResponse.json();

    // 소스가 이미 있는지 확인
    if (!mapInstance.getSource('world-land')) {
      mapInstance.addSource('world-land', { type: 'geojson', data: landData });
    }
    if (!mapInstance.getSource('south-korea')) {
      mapInstance.addSource('south-korea', {
        type: 'geojson',
        data: koreaData,
      });
    }

    // 레이어가 이미 있는지 확인하고 순서대로 추가
    if (!mapInstance.getLayer('world-land-fill')) {
      mapInstance.addLayer({
        id: 'world-land-fill',
        type: 'fill',
        source: 'world-land',
        paint: { 'fill-color': '#3f425e', 'fill-opacity': 1 },
      });
    }
    if (!mapInstance.getLayer('south-korea-fill')) {
      mapInstance.addLayer({
        id: 'south-korea-fill',
        type: 'fill',
        source: 'south-korea',
        paint: { 'fill-color': '#676693', 'fill-opacity': 1 },
      });
    }
    if (!mapInstance.getLayer('south-korea-outline')) {
      mapInstance.addLayer({
        id: 'south-korea-outline',
        type: 'line',
        source: 'south-korea',
        paint: { 'line-color': '#ccc', 'line-width': 1 },
      });
    }
  } catch (error) {
    console.error('Base map loading error:', error);
  }
}

// 현재 진행 중인 태풍 (실시간 데이터)
// 현재 태풍이 없으면 null로 설정
const currentTyphoon = {
  name: '제비(JEBI)',
  number: '18',
  year: 2025,
  path: [
    {
      coord: [126.5, 29.0],
      time: '20일(화) 06시',
      wind: 18,
      windRadius15: 250,
      windRadius25: 150,
      isPast: true,
    },
    {
      coord: [127.0, 30.5],
      time: '20일(화) 12시',
      wind: 20,
      windRadius15: 270,
      windRadius25: 170,
      isPast: true,
    },
    {
      coord: [127.5, 32.0],
      time: '20일(화) 18시',
      wind: 22,
      windRadius15: 280,
      windRadius25: 180,
      isPast: false,
      isCurrent: true,
    },
    {
      coord: [128.0, 33.5],
      time: '21일(수) 00시',
      wind: 24,
      windRadius15: 300,
      windRadius25: 200,
      isPast: false,
    },
    {
      coord: [128.5, 35.0],
      time: '21일(수) 06시',
      wind: 26,
      windRadius15: 320,
      windRadius25: 220,
      isPast: false,
    },
    {
      coord: [129.0, 36.5],
      time: '21일(수) 18시',
      wind: 28,
      windRadius15: 350,
      windRadius25: 240,
      isPast: false,
    },
  ],
  currentPosition: 2, // 현재 위치 인덱스
  damage: 0, // 진행중이라 미정
  rain: 0,
  wind: 22,
  casualties: 0,
  pressure: 965,
  windRadius: 280, // 15m/s 강풍 반경
  windRadius25: 180, // 25m/s 강풍 반경
  color: 'red',
  category: '강',
  isCurrent: true,
};

// 현재 태풍이 없을 때는 이렇게 설정:
// const currentTyphoon = null;

// 역대 주요 태풍 데이터 - 각각 다른 색상
const typhoons = [
  {
    name: '사라',
    year: 1959,
    path: [
      [123.0, 27.0],
      [124.5, 29.5],
      [126.0, 31.0],
      [127.0, 33.5],
      [128.5, 36.0],
      [130.0, 38.0],
      [131.0, 40.0],
      [132.0, 42.0],
      [133.0, 44.0],
      [134.0, 46.0],
    ],
    damage: 850,
    rain: 385.0,
    wind: 85,
    casualties: 849,
    pressure: 950,
    windRadius: 300,
    color: '#FFA07A',
    category: '초강력',
    description:
      '1959년 태풍 사라는 관측 이래 최대 규모의 태풍으로, 최저기압 최저기압(950hpa)과 초속 85m/sec의 강풍 및 폭우로 평상복도에 막대한 피해를 입혔습니다.',
  },
  {
    name: '루사',
    year: 2002,
    path: [
      [123.0, 26.0],
      [124.5, 28.5],
      [126.0, 31.0],
      [127.5, 33.0],
      [129.0, 35.5],
      [130.5, 37.5],
      [131.5, 39.5],
      [132.0, 41.0],
      [132.5, 43.0],
      [133.0, 45.0],
    ],
    damage: 51000,
    rain: 870.5,
    wind: 56,
    casualties: 246,
    pressure: 950,
    windRadius: 330,
    color: '#4ECDC4',
    category: '초강력',
    description:
      '이 태풍은 3,382명의 인명피해와 2,490억 원의 재산피해(2003년 기준)를 가져왔으며, 당시 가장 오랜 인류 피해 규모가 더욱 커졌던 대표적인 재난으로 남아있습니다.',
  },
  {
    name: '매미',
    year: 2003,
    path: [
      [122.0, 27.0],
      [123.5, 29.0],
      [125.0, 32.0],
      [126.5, 33.5],
      [128.0, 35.0],
      [129.5, 36.5],
      [130.0, 38.0],
      [130.5, 40.0],
      [131.0, 42.0],
      [131.5, 44.0],
    ],
    damage: 51470,
    rain: 455.5,
    wind: 60,
    casualties: 131,
    pressure: 910,
    windRadius: 350,
    color: '#FF6B6B',
    category: '초강력',
  },
  {
    name: '사오마이',
    year: 2006,
    path: [
      [122.5, 26.0],
      [124.0, 28.5],
      [125.5, 30.5],
      [127.0, 32.5],
      [128.5, 34.5],
      [129.5, 36.5],
      [130.0, 38.5],
      [130.5, 40.5],
      [131.0, 42.5],
      [131.5, 44.5],
    ],
    damage: 387,
    rain: 658.5,
    wind: 44,
    casualties: 12,
    pressure: 970,
    windRadius: 260,
    color: '#74B9FF',
    category: '매우강',
  },
  {
    name: '나리',
    year: 2007,
    path: [
      [125.0, 26.0],
      [126.5, 28.5],
      [128.0, 31.0],
      [129.0, 33.0],
      [129.5, 35.5],
      [129.0, 37.5],
      [128.5, 39.0],
      [128.0, 40.5],
      [127.5, 42.5],
      [127.0, 44.5],
    ],
    damage: 423,
    rain: 732.5,
    wind: 45,
    casualties: 18,
    pressure: 960,
    windRadius: 280,
    color: '#FF9CEE',
    category: '매우강',
  },
  {
    name: '곤파스',
    year: 2010,
    path: [
      [122.0, 25.5],
      [123.5, 28.0],
      [125.0, 30.0],
      [126.5, 32.5],
      [128.0, 35.0],
      [129.0, 37.0],
      [129.5, 39.0],
      [130.0, 41.0],
      [130.5, 43.0],
      [131.0, 45.0],
    ],
    damage: 1055,
    rain: 248.0,
    wind: 43,
    casualties: 8,
    pressure: 965,
    windRadius: 270,
    color: '#95E1D3',
    category: '강',
  },
  {
    name: '볼라벤',
    year: 2012,
    path: [
      [121.0, 24.0],
      [122.5, 26.5],
      [124.0, 29.0],
      [125.5, 31.5],
      [126.5, 34.0],
      [127.0, 36.5],
      [127.5, 39.0],
      [128.0, 41.5],
      [128.5, 43.5],
      [129.0, 45.5],
    ],
    damage: 1078,
    rain: 258.5,
    wind: 51,
    casualties: 15,
    pressure: 920,
    windRadius: 310,
    color: '#A78BFA',
    category: '초강력',
  },
  {
    name: '차바',
    year: 2016,
    path: [
      [124.0, 25.0],
      [125.5, 27.5],
      [127.0, 30.0],
      [128.0, 32.5],
      [129.0, 35.0],
      [129.5, 37.0],
      [130.0, 39.0],
      [130.5, 41.0],
      [131.0, 43.0],
      [131.5, 45.0],
    ],
    damage: 2673,
    rain: 304.0,
    wind: 52,
    casualties: 7,
    pressure: 905,
    windRadius: 320,
    color: '#FFD93D',
    category: '초강력',
  },
];

// 지도 로드 완료
map.on('load', async () => {
  // SVG 내용을 직접 인코딩하여 아이콘 생성
  const icons = [
    {
      name: 'typhoon-td',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="white" stroke="#333" stroke-width="2"/><path stroke="#333" stroke-width="3" fill="none" d="M10 10L30 30M30 10L10 30"/></svg>',
    },
    {
      name: 'typhoon-past',
      svg: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 34"><path fill="#353578" d="M24.79,1.89c0.11,0,0.15-0.15,0.05-0.2c-2.26-1.1-5.36-1.9-8.56-1.53c-3.1,0.36-6.04,1.71-9.17,4.54 c-2.75,2.5-5.19,6.42-5.48,10.75c-0.36,5.41,2.72,11.38,9.77,13.34c-2.54,1.8-6.01,3.02-9.66,3.52c-0.1,0.01-0.13,0.15-0.04,0.19 c2.76,1.56,5.66,1.6,8.94,1.22c3.1-0.36,6.79-2.04,9.02-3.84c2.13-1.72,6.13-5.39,6.69-11.05c0.61-6.07-4.49-13.26-11.64-13.57 C17.23,3.49,21.04,1.93,24.79,1.89z"/></svg>',
    },
    {
      name: 'typhoon-mild',
      svg: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 115.9"><path fill="#ff6600" d="M79.5,6.3c0.2-0.1,0.3-0.3,0.2-0.5c0-0.1-0.1-0.1-0.1-0.2c-9.1-4.4-19.2-6.3-29.3-5.3 C39.7,1.6,29.6,6.2,18.9,15.9S1.1,37.9,0.1,52.7c-1.2,18.5,9.3,39,33.5,45.7c-8.7,6.2-20.6,10.3-33.1,12c-0.2,0.1-0.3,0.3-0.2,0.5 c0,0.1,0.1,0.1,0.1,0.2c9.4,5.3,19.3,5.5,30.6,4.2s23.3-7,30.9-13.2s21-18.4,22.9-37.8S69.4,18.9,45,17.8 C53.6,11.7,66.6,6.4,79.5,6.3z M61,76.9c-10.1,10.2-26.6,10.3-36.8,0.2S13.9,50.5,24,40.3S50.6,30,60.8,40.1 c0.1,0.1,0.1,0.1,0.2,0.2C71,50.4,71,66.8,61,76.9z"/></svg>',
    },
    {
      name: 'typhoon-strong',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 115.9"><path fill="#ff0000" d="M79.5,6.3c0.2-0.1,0.3-0.3,0.2-0.5c0-0.1-0.1-0.1-0.1-0.2c-9.1-4.4-19.2-6.3-29.3-5.3 C39.7,1.6,29.6,6.2,18.9,15.9S1.1,37.9,0.1,52.7c-1.2,18.5,9.3,39,33.5,45.7c-8.7,6.2-20.6,10.3-33.1,12c-0.2,0.1-0.3,0.3-0.2,0.5 c0,0.1,0.1,0.1,0.1,0.2c9.4,5.3,19.3,5.5,30.6,4.2s23.3-7,30.9-13.2s21-18.4,22.9-37.8S69.4,18.9,45,17.8 C53.6,11.7,66.6,6.4,79.5,6.3z M61,76.9c-10.1,10.2-26.6,10.3-36.8,0.2S13.9,50.5,24,40.3S50.6,30,60.8,40.1 c0.1,0.1,0.1,0.1,0.2,0.2C71,50.4,71,66.8,61,76.9z"/></svg>',
    },
  ];

  // SVG를 data:image/svg+xml 형식으로 변환
  for (const icon of icons) {
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (!map.hasImage(icon.name)) {
            map.addImage(icon.name, img, { pixelRatio: 2 });
            console.log(`✓ Successfully loaded ${icon.name}`);
          }
          resolve();
        };
        img.onerror = (error) => {
          console.error(`Failed to load ${icon.name}:`, error);
          reject(error);
        };
        // SVG를 data URL로 직접 인코딩 (CORS 문제 회피)
        const encodedSvg =
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icon.svg);
        img.src = encodedSvg;
      });
    } catch (error) {
      console.error(`✗ Could not load ${icon.name}:`, error);
    }
  }

  console.log('Icon loading complete, initializing map...');
  initializeMap();
});

// 누락된 아이콘에 대한 대체 처리
map.on('styleimagemissing', (e) => {
  const id = e.id;
  console.warn(`Missing image: ${id}, creating placeholder`);

  // 간단한 원형 플레이스홀더 생성
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 원 그리기
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
  ctx.fillStyle = '#FF6B6B';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  map.addImage(id, canvas);
});

async function initializeMap() {
  // 1. 베이스 레이어 먼저 추가
  await addBaseLayers(map);

  // 2. 현재 진행 중인 태풍 먼저 추가 (있는 경우만)
  if (currentTyphoon) {
    addCurrentTyphoonToMap(currentTyphoon);
  }

  // 3. 역대 태풍 경로 그리기
  typhoons.forEach((typhoon, index) => {
    addTyphoonToMap(typhoon, index, false);
  });

  // 현재 태풍 렌더링 (있는 경우만)
  if (currentTyphoon) {
    renderCurrentTyphoon(currentTyphoon);
  }

  // 역대 태풍 셀렉트 이벤트 설정
  setupTyphoonSelect();
}

// 마커 opacity 설정 헬퍼 함수 (symbol과 circle 모두 지원)
function setMarkerOpacity(layerId, opacity) {
  if (!map.getLayer(layerId)) return;

  const layer = map.getLayer(layerId);
  if (layer.type === 'symbol') {
    map.setPaintProperty(layerId, 'icon-opacity', opacity);
    if (map.getPaintProperty(layerId, 'text-opacity') !== undefined) {
      map.setPaintProperty(layerId, 'text-opacity', opacity);
    }
  } else if (layer.type === 'circle') {
    map.setPaintProperty(layerId, 'circle-opacity', opacity);
    map.setPaintProperty(layerId, 'circle-stroke-opacity', opacity);
  }
}

// 현재 태풍을 지도에 추가하는 함수 (기상청 스타일)
function addCurrentTyphoonToMap(typhoon) {
  if (!typhoon) return;

  // 경로 좌표 추출
  const pathCoords = typhoon.path.map((p) => p.coord);
  const currentPos = typhoon.currentPosition;

  // 1. 지나간 경로 (점선)
  map.addSource('typhoon-route-current-past', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: pathCoords.slice(0, currentPos + 1),
      },
    },
  });

  map.addLayer({
    id: 'typhoon-route-current-past',
    type: 'line',
    source: 'typhoon-route-current-past',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#FF4444',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 1,
    },
  });

  // 2. 강풍 영역 (현재 위치)
  const currentPoint = typhoon.path[currentPos];

  // 15m/s 강풍 영역 (노란색)
  map.addSource('wind-area-15', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: currentPoint.coord,
      },
      properties: {
        radius: currentPoint.windRadius15,
      },
    },
  });

  map.addLayer({
    id: 'wind-area-15',
    type: 'circle',
    source: 'wind-area-15',
    paint: {
      'circle-radius': {
        stops: [
          [0, 0],
          [6, currentPoint.windRadius15 / 5],
          [10, currentPoint.windRadius15 / 3],
          [20, currentPoint.windRadius15],
        ],
        base: 2,
      },
      'circle-color': '#fdef0f',
      'circle-opacity': 0.55,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fdef0f',
      'circle-stroke-opacity': 1,
      'circle-stroke-dasharray': [2, 2],
    },
  });

  // 25m/s 강풍 영역 (주황색)
  map.addSource('wind-area-25', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: currentPoint.coord,
      },
      properties: {
        radius: currentPoint.windRadius25,
      },
    },
  });

  map.addLayer({
    id: 'wind-area-25',
    type: 'circle',
    source: 'wind-area-25',
    paint: {
      'circle-radius': {
        stops: [
          [0, 0],
          [6, currentPoint.windRadius25 / 5],
          [10, currentPoint.windRadius25 / 3],
          [20, currentPoint.windRadius25],
        ],
        base: 2,
      },
      'circle-color': '#fe9000',
      'circle-opacity': 0.6,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fe7200',
      'circle-stroke-opacity': 1,
    },
  });

  // 3. 마커 - 과거/현재/미래 구분
  const pointsData = {
    type: 'FeatureCollection',
    features: typhoon.path.map((point, idx) => ({
      type: 'Feature',
      properties: {
        time: point.time,
        wind: point.wind,
        isCurrent: idx === currentPos,
        isPast: idx < currentPos,
        isFuture: idx > currentPos,
      },
      geometry: {
        type: 'Point',
        coordinates: point.coord,
      },
    })),
  };

  map.addSource('typhoon-points-current', {
    type: 'geojson',
    data: pointsData,
  });

  // SVG 아이콘 사용
  map.addLayer({
    id: 'typhoon-points-current',
    type: 'symbol',
    source: 'typhoon-points-current',
    layout: {
      'icon-image': [
        'case',
        ['get', 'isPast'],
        'typhoon-td',
        ['get', 'isCurrent'],
        [
          'case',
          ['>=', ['get', 'wind'], 24],
          'typhoon-strong',
          ['>=', ['get', 'wind'], 17],
          'typhoon-mild',
          'typhoon-past',
        ],
        'typhoon-past',
      ],
      'icon-size': ['case', ['get', 'isCurrent'], 0.8, 0.5],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      'icon-opacity': 1,
    },
  });

  // 4. 70% 확률 예상 영역 (미래 경로 - 보라색)
  const futurePoints = typhoon.path.filter((_, idx) => idx > currentPos);

  futurePoints.forEach((point, idx) => {
    const probabilityCircle = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point.coord,
      },
    };

    const sourceId = `probability-area-${idx}`;
    map.addSource(sourceId, {
      type: 'geojson',
      data: probabilityCircle,
    });

    const probabilityRadius = 100 + idx * 30;

    map.addLayer({
      id: sourceId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [6, probabilityRadius / 5],
            [10, probabilityRadius / 3],
            [20, probabilityRadius],
          ],
          base: 2,
        },
        'circle-color': '#9966ff',
        'circle-opacity': 0.25,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#9966ff',
        'circle-stroke-opacity': 0.5,
      },
    });
  });

  // 시간 라벨 추가
  map.addLayer({
    id: 'typhoon-points-current-labels',
    type: 'symbol',
    source: 'typhoon-points-current',
    layout: {
      'text-field': ['get', 'time'],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 12,
      'text-offset': [0, 2.2],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1.5,
    },
  });
}

// 역대 태풍을 지도에 추가하는 함수
function addTyphoonToMap(typhoon, index, isVisible) {
  // 경로 라인 추가
  map.addSource(`typhoon-route-${index}`, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {
        name: typhoon.name,
        year: typhoon.year,
      },
      geometry: {
        type: 'LineString',
        coordinates: typhoon.path,
      },
    },
  });

  map.addLayer({
    id: `typhoon-route-${index}`,
    type: 'line',
    source: `typhoon-route-${index}`,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': typhoon.color,
      'line-width': 2,
      'line-opacity': isVisible ? 1 : 0,
    },
  });

  // 경로 포인트를 GeoJSON으로 추가
  const pointsData = {
    type: 'FeatureCollection',
    features: typhoon.path.map((coord, pointIndex) => ({
      type: 'Feature',
      properties: {
        name: typhoon.name,
        year: typhoon.year,
        index: index,
        pointIndex: pointIndex,
      },
      geometry: {
        type: 'Point',
        coordinates: coord,
      },
    })),
  };

  // 마커 포인트 소스 추가
  map.addSource(`typhoon-points-${index}`, {
    type: 'geojson',
    data: pointsData,
  });

  // 마커 레이어 추가
  map.addLayer({
    id: `typhoon-points-${index}`,
    type: 'circle',
    source: `typhoon-points-${index}`,
    paint: {
      'circle-radius': 5,
      'circle-color': typhoon.color,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'white',
      'circle-opacity': isVisible ? 0.9 : 0,
      'circle-stroke-opacity': isVisible ? 0.9 : 0,
    },
  });

  // 클릭 이벤트 추가
  map.on('click', `typhoon-points-${index}`, (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();

    // 기존 팝업 제거
    const existingPanel = document.getElementById('typhoon-info-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    // 지도 컨테이너 가져오기
    const mapContainer = document.getElementById('map');

    // 팝업 패널 생성
    const infoPanel = document.createElement('div');
    infoPanel.id = 'typhoon-info-panel';
    infoPanel.className = 'cnt-map-popup-panel';
    infoPanel.innerHTML = `
            <button class="cnt-map-popup__btn-close" onclick="this.parentElement.remove()">×</button>
            <div class="cnt-map-popup__content-wrapper">
                <div class="cnt-map-popup__header">
                    <h3 class="cnt-map-popup__header-title">${typhoon.name}(${typhoon.year})</h3>
                </div>
                <div class="cnt-map-popup__body">
                    <div class="cnt-map-popup__image">
                        <img src="./assets/images/temp/img2.jpg">
                    </div>
                    <div class="cnt-map-popup__info-table">
                        <div class="cnt-map-popup__date">
                            <span class="cnt-map-popup__date-label">관측시각 :</span>
                            <span class="cnt-map-popup__date-value">${typhoon.year}년</span>
                        </div>
                        <ul class="cnt-map-popup__info-list">
                          <li>
                              <span class="cnt-map-popup__info-label">최대 풍속</span>
                              <span class="cnt-map-popup__info-value">${typhoon.wind} m/s</span>
                          </li>
                          <li>
                              <span class="cnt-map-popup__info-label">중심 기압</span>
                              <span class="cnt-map-popup__info-value">${typhoon.pressure} hPa</span>
                          </li>
                          <li>
                              <span class="cnt-map-popup__info-label">강풍 반경<br>(풍속 15m/s 이상)</span>
                              <span class="cnt-map-popup__info-value">${typhoon.windRadius} km</span>
                          </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

    mapContainer.appendChild(infoPanel);

    map.flyTo({
      center: coordinates,
      zoom: 8,
      duration: 1500,
    });
  });

  // 마우스 커서 변경
  map.on('mouseenter', `typhoon-points-${index}`, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', `typhoon-points-${index}`, () => {
    map.getCanvas().style.cursor = '';
  });
}

// 태풍 경로 애니메이션 함수
function animateTyphoonRoute(routeIndex) {
  const typhoon = typhoons[routeIndex];
  const routeId = `typhoon-route-${routeIndex}`;
  const pointsId = `typhoon-points-${routeIndex}`;
  const routeSource = map.getSource(routeId);
  const pointsSource = map.getSource(pointsId);
  const fullPath = typhoon.path;

  if (!routeSource) return;

  map.setPaintProperty(routeId, 'line-opacity', 1);
  map.setPaintProperty(routeId, 'line-width', 2);

  const animationDuration = 3000;
  let startTime = performance.now();

  const segmentLengths = [];
  let totalLength = 0;
  for (let i = 0; i < fullPath.length - 1; i++) {
    const [lng1, lat1] = fullPath[i];
    const [lng2, lat2] = fullPath[i + 1];
    const length = Math.sqrt(
      Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2)
    );
    segmentLengths.push(length);
    totalLength += length;
  }

  const animatedCoords = [];

  const allPoints = fullPath.map((coord, pointIndex) => ({
    type: 'Feature',
    properties: {
      name: typhoon.name,
      year: typhoon.year,
      index: routeIndex,
      pointIndex: pointIndex,
      isCurrent: false,
      isFirst: pointIndex === 0,
    },
    geometry: {
      type: 'Point',
      coordinates: coord,
    },
  }));

  function animate(timestamp) {
    const progress = timestamp - startTime;
    const progressRatio = Math.min(progress / animationDuration, 1);

    const currentLength = totalLength * progressRatio;

    let accumulatedLength = 0;
    animatedCoords.length = 0;
    animatedCoords.push(fullPath[0]);

    for (let i = 0; i < segmentLengths.length; i++) {
      const segmentLength = segmentLengths[i];

      if (accumulatedLength + segmentLength < currentLength) {
        animatedCoords.push(fullPath[i + 1]);
        accumulatedLength += segmentLength;
      } else if (accumulatedLength < currentLength) {
        const remainingLength = currentLength - accumulatedLength;
        const ratio = remainingLength / segmentLength;

        const [lng1, lat1] = fullPath[i];
        const [lng2, lat2] = fullPath[i + 1];

        const interpolatedLng = lng1 + (lng2 - lng1) * ratio;
        const interpolatedLat = lat1 + (lat2 - lat1) * ratio;

        animatedCoords.push([interpolatedLng, interpolatedLat]);
        break;
      } else {
        break;
      }
    }

    routeSource.setData({
      type: 'Feature',
      properties: {
        name: typhoon.name,
        year: typhoon.year,
      },
      geometry: {
        type: 'LineString',
        coordinates: animatedCoords,
      },
    });

    if (pointsSource) {
      const visiblePointsCount = Math.floor(progressRatio * fullPath.length);
      const currentPoints = allPoints.slice(0, Math.max(1, visiblePointsCount));
      pointsSource.setData({
        type: 'FeatureCollection',
        features: currentPoints,
      });
      setMarkerOpacity(pointsId, 1);
    }

    if (progressRatio < 1) {
      requestAnimationFrame(animate);
    } else {
      if (pointsSource) {
        pointsSource.setData({
          type: 'FeatureCollection',
          features: allPoints,
        });
      }
    }
  }

  requestAnimationFrame(animate);
}

// 현재 진행 중인 태풍 렌더링
function renderCurrentTyphoon(typhoon) {
  const container = document.getElementById('current-typhoon-section');
  if (!container) return;

  if (!typhoon) {
    container.innerHTML =
      '<p class="cnt-panel-text">현재 진행중인 태풍이 없습니다.</p>';
    return;
  }

  container.innerHTML = `
        <div class="cnt-current-typhoon-item">
            <span class="cnt-typhoon-badge">진행중</span>
            <span class="cnt-typhoon-number">2025년 제 ${typhoon.number}호 ${typhoon.name}</span>
        </div>
    `;
}

// 역대 태풍 셀렉트 이벤트 설정
function setupTyphoonSelect() {
  const infoContainer = document.getElementById('selected-typhoon-info');
  const customSelect = document.getElementById('typhoon-select');
  if (!customSelect) return;

  const selectTrigger = customSelect.querySelector(
    '.cnt-custom-select__trigger'
  );
  const options = customSelect.querySelectorAll('.cnt-custom-select__option');

  // 드롭다운 위치 계산 함수
  function calculateDropdownPosition() {
    const rect = customSelect.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 280; // max-height

    // 아래 공간이 부족하고 위 공간이 충분하면 위로 열기
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      customSelect.classList.add('open-upward');
    } else {
      customSelect.classList.remove('open-upward');
    }
  }

  // 드롭다운 열기/닫기
  selectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    // 다른 열린 셀렉트 닫기
    document.querySelectorAll('.cnt-custom-select.open').forEach((sel) => {
      if (sel !== customSelect) {
        sel.classList.remove('open');
        sel.classList.remove('open-upward');
      }
    });

    // 위치 계산
    calculateDropdownPosition();

    customSelect.classList.toggle('open');
  });

  // 옵션 선택
  options.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedIndex = option.getAttribute('data-value');
      const typhoon = typhoons[selectedIndex];

      // 선택된 항목 업데이트
      const colorIndicator = option.querySelector(
        '.cnt-color-indicator'
      ).outerHTML;
      const text = option.querySelector(
        '.cnt-custom-select__option-text'
      ).textContent;
      selectTrigger.querySelector('.cnt-custom-select__text').innerHTML =
        `${colorIndicator}${text}`;

      // 드롭다운 닫기
      customSelect.classList.remove('open');
      customSelect.classList.remove('open-upward');

      // 선택된 태풍 처리
      handleTyphoonSelection(selectedIndex, typhoon);
    });
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
      customSelect.classList.remove('open-upward');
    }
  });

  // 선택 처리 함수
  function handleTyphoonSelection(selectedIndex, typhoon) {
    const index = parseInt(selectedIndex);

    // 선택된 태풍 정보 표시
    infoContainer.classList.add('active');
    infoContainer.innerHTML = `
            <div class="cnt-panel-text-box__content">
                <p class="cnt-panel-text">${typhoon.description || `${typhoon.year}년 태풍 ${typhoon.name}은 관측 이래 최대 규모의 태풍으로, 최저기압 ${typhoon.pressure}hPa와 초속 ${typhoon.wind}m/sec의 강풍 및 폭우로 막대한 피해를 입혔습니다.`}</p>
                <p class="cnt-panel-text">이 태풍은 ${typhoon.casualties.toLocaleString()}명의 인명피해와 ${(typhoon.damage / 10000).toFixed(0)}조 ${typhoon.damage % 10000}억 원의 재산피해를 가져왔으며, 당시 가장 큰 재난으로 남아있습니다.</p>
            </div>
        `;

    // 태풍 경로 전체를 보여주는 bounds 계산
    const bounds = new mapboxgl.LngLatBounds();
    typhoon.path.forEach((coord) => {
      bounds.extend(coord);
    });

    // 현재 태풍 경로도 포함
    if (currentTyphoon) {
      currentTyphoon.path.forEach((p) => {
        bounds.extend(p.coord);
      });
    }

    // 지도를 bounds에 맞춰 이동
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 400 },
      duration: 1500,
      maxZoom: 8,
    });

    // 모든 역대 태풍 경로와 마커 숨기기
    typhoons.forEach((_, i) => {
      if (map.getLayer(`typhoon-route-${i}`)) {
        map.setPaintProperty(`typhoon-route-${i}`, 'line-opacity', 0);
      }
      setMarkerOpacity(`typhoon-points-${i}`, 0);
    });

    // 현재 진행 중인 태풍 경로는 항상 보이도록
    if (currentTyphoon && map.getLayer('typhoon-route-current-past')) {
      map.setPaintProperty('typhoon-route-current-past', 'line-opacity', 0.6);
      map.setPaintProperty('typhoon-route-current-past', 'line-width', 2);
    }

    if (currentTyphoon) {
      setMarkerOpacity('typhoon-points-current', 0.6);
    }

    setMarkerOpacity(`typhoon-points-${index}`, 0);

    setTimeout(() => {
      animateTyphoonRoute(index);
    }, 1500);
  }
}

// ============================================ //
// 탭 전환 기능
// ============================================ //

let mapTop5, mapVideos;
let currentTab = 'tabTyphoon1';

// 탭 버튼 클릭 이벤트
document.querySelectorAll('.cnt-main-tab__button').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const tabId = e.target.dataset.tab;
    switchTab(tabId);
  });
});

function switchTab(tabId) {
  if (currentTab === tabId) return;

  currentTab = tabId;

  // 탭 버튼 활성화 상태 변경
  document.querySelectorAll('.cnt-main-tab__button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // 탭 컨텐츠 표시/숨김
  document.querySelectorAll('.cnt-main-tab__content').forEach((content) => {
    content.classList.toggle('active', content.id === tabId);
  });

  // 탭을 처음 방문하는 경우 오버레이 펼치기
  setTimeout(() => {
    if (!tabVisited[tabId]) {
      tabVisited[tabId] = true;
      const overlayMap = {
        tabTyphoon1: 'mapOverlay1',
        tabTyphoon2: 'mapOverlay2',
        tabTyphoon3: 'mapOverlay3',
      };
      const overlayId = overlayMap[tabId];
      if (overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
          overlay.classList.remove('collapsed');
          overlayStates[overlayId] = true;
        }
      }
    }
  }, 0);

  // 맵 초기화
  if (tabId === 'tabTyphoon2' && !mapTop5) {
    initMapTop5();
  } else if (tabId === 'tabTyphoon3' && !mapVideos) {
    initMapVideos();
  }

  // 맵 리사이즈
  setTimeout(() => {
    if (tabId === 'tabTyphoon1') map.resize();
    else if (tabId === 'tabTyphoon2' && mapTop5) mapTop5.resize();
    else if (tabId === 'tabTyphoon3' && mapVideos) mapVideos.resize();
  }, 100);
}

// ============================================ //
// 탭2: TOP 5 태풍 맵
// ============================================ //

// 순위별 색상: 1위 F65570, 2위 DA9EFF, 3위 E2B35D, 4위 52D03E, 5위 87E5FF
const top5Colors = ['#F65570', '#DA9EFF', '#E2B35D', '#52D03E', '#87E5FF'];

const top5DamageData = [...typhoons]
  .sort((a, b) => b.damage - a.damage)
  .slice(0, 5)
  .map((t, i) => ({ ...t, rank: i + 1 }));

const top5CasualtiesData = [...typhoons]
  .sort((a, b) => b.casualties - a.casualties)
  .slice(0, 5)
  .map((t, i) => ({ ...t, rank: i + 1 }));

let currentRankingType = 'wind';

function initMapTop5() {
  mapTop5 = new mapboxgl.Map({
    container: 'map-top5',
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#191b2e',
          },
        },
      ],
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    },
    center: [128.0, 36.0],
    zoom: 5.5,
    pitch: 0,
  });

  mapTop5.on('load', async () => {
    await addBaseLayers(mapTop5);

    // 초기 렌더링 - 풍속 기준
    const windData = [...typhoons]
      .sort((a, b) => b.wind - a.wind)
      .slice(0, 5)
      .map((t, i) => ({ ...t, rank: i + 1 }));
    renderTop5Map(windData);
    renderTop5List(windData);
  });

  mapTop5.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

  // 순위 기준 커스텀 셀렉트 이벤트
  setupCustomSelect('ranking-type-select', (type) => {
    currentRankingType = type;

    // 제목 업데이트
    const controlHeader = document.querySelector(
      '#tabTyphoon2 .cnt-panel-content__title'
    );
    if (controlHeader) {
      if (type === 'wind') {
        controlHeader.textContent = '최대 순간 풍속 순위';
      } else if (type === 'damage') {
        controlHeader.textContent = '피해 재산 순위';
      } else if (type === 'casualties') {
        controlHeader.textContent = '인명 피해 순위';
      }
    }

    // 데이터 업데이트
    let data;
    if (type === 'wind') {
      data = [...typhoons]
        .sort((a, b) => b.wind - a.wind)
        .slice(0, 5)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    } else if (type === 'damage') {
      data = top5DamageData;
    } else if (type === 'casualties') {
      data = top5CasualtiesData;
    }

    renderTop5Map(data);
    renderTop5List(data);
  });
}

function renderTop5Map(data) {
  if (!mapTop5) return;

  // 기존 레이어 및 소스 제거
  for (let i = 0; i < 5; i++) {
    const routeLayerId = `top5-route-${i}`;
    const labelLayerId = `top5-label-${i}`;
    const routeSourceId = `top5-route-${i}`;
    const labelSourceId = `top5-label-point-${i}`;

    if (mapTop5.getLayer(routeLayerId)) mapTop5.removeLayer(routeLayerId);
    if (mapTop5.getLayer(labelLayerId)) mapTop5.removeLayer(labelLayerId);
    if (mapTop5.getSource(routeSourceId)) mapTop5.removeSource(routeSourceId);
    if (mapTop5.getSource(labelSourceId)) mapTop5.removeSource(labelSourceId);
  }

  // 애니메이션 헬퍼 함수
  function animateLine(source, fullPath, duration, callback) {
    if (!source) return;

    let startTime = performance.now();

    function frame(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const totalPoints = fullPath.length;
      const currentPointIndex = Math.floor(progress * (totalPoints - 1));
      const currentPath = fullPath.slice(0, currentPointIndex + 1);

      if (progress < 1 && currentPointIndex < totalPoints - 1) {
        const segmentProgress =
          progress * (totalPoints - 1) - currentPointIndex;
        const [lng1, lat1] = fullPath[currentPointIndex];
        const [lng2, lat2] = fullPath[currentPointIndex + 1];
        currentPath.push([
          lng1 + (lng2 - lng1) * segmentProgress,
          lat1 + (lat2 - lat1) * segmentProgress,
        ]);
      }

      source.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: currentPath },
      });

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        source.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: fullPath },
        });

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  // TOP 5 태풍 경로 및 레이블 추가 및 애니메이션
  data.forEach((typhoon, index) => {
    if (!typhoon || !typhoon.path || typhoon.path.length === 0) return;

    const color = top5Colors[index];
    const routeSourceId = `top5-route-${index}`;
    const labelSourceId = `top5-label-point-${index}`;
    const fullPath = typhoon.path;

    // 1. 경로 소스 및 레이어 추가
    mapTop5.addSource(routeSourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] },
      },
    });

    mapTop5.addLayer({
      id: `top5-route-${index}`,
      type: 'line',
      source: routeSourceId,
      paint: {
        'line-color': color,
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });

    // 2. 라인을 따라 텍스트 배치
    mapTop5.addSource(labelSourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] },
        properties: {
          name: `${index + 1}위 ${typhoon.year}년 ${typhoon.name}`,
        },
      },
    });

    mapTop5.addLayer({
      id: `top5-label-${index}`,
      type: 'symbol',
      source: labelSourceId,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-radial-offset': 0,
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'viewport',
        'text-max-angle': 90,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'symbol-spacing': 250,
        'text-keep-upright': false,
      },
      paint: {
        'text-color': color,
        'text-halo-color': '#000000',
        'text-halo-width': 2.5,
        'text-opacity': 0.9,
      },
    });

    // 3. 순위에 따라 지연 시작되는 애니메이션
    setTimeout(() => {
      const source = mapTop5.getSource(routeSourceId);
      animateLine(source, fullPath, 1500, () => {
        const labelSource = mapTop5.getSource(labelSourceId);
        if (labelSource) {
          labelSource.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: fullPath },
            properties: {
              name: `${index + 1}위 ${typhoon.year}년 ${typhoon.name}`,
            },
          });
        }
      });
    }, index * 200);
  });
}

function renderTop5List(data) {
  const listContainer = document.getElementById('topTyphoonList');
  if (!listContainer) return;

  listContainer.innerHTML = data
    .map((typhoon, index) => {
      const color = top5Colors[index];
      let value;
      if (currentRankingType === 'wind') {
        value = `${typhoon.wind} m/s`;
      } else if (currentRankingType === 'damage') {
        value = `${(typhoon.damage / 10000).toFixed(0)}조 ${typhoon.damage % 10000}억 원`;
      } else if (currentRankingType === 'casualties') {
        value = `${typhoon.casualties}명`;
      }

      return `
            <li class="cnt-top5-list__item" style="border-left: 4px solid ${color}">
                <div class="cnt-top5-list__header">
                    <span class="cnt-top5-list__rank" style="color: ${color}">${typhoon.rank}위</span>
                    <span class="cnt-top5-list__name">${typhoon.name} (${typhoon.year}년)</span>
                </div>
                <div class="cnt-top5-list__value">${value}</div>
            </li>
        `;
    })
    .join('');
}

// ============================================ //
// 탭3: 영상 마커 맵
// ============================================ //

const videoData = [
  {
    coord: [129.0, 35.1],
    number: 1,
    type: 'approaching',
    title: '[강릉] 영동지역의 폭우',
    date: '2002.08.31',
    thumbnail: './assets/images/video/thumb1.jpg',
    url: '#',
  },
  {
    coord: [126.5, 33.5],
    number: 2,
    type: 'approaching',
    title: '[제주] 태풍 차바 접근',
    date: '2016.10.05',
    thumbnail: './assets/images/video/thumb2.jpg',
    url: '#',
  },
  {
    coord: [128.6, 35.9],
    number: 3,
    type: 'approaching',
    title: '[부산] 태풍 매미 상륙',
    date: '2003.09.12',
    thumbnail: './assets/images/video/thumb3.jpg',
    url: '#',
  },
  {
    coord: [127.0, 37.5],
    number: 4,
    type: 'damage',
    title: '[서울] 침수 피해 현장',
    date: '2012.08.28',
    thumbnail: './assets/images/video/thumb4.jpg',
    url: '#',
  },
];

function initMapVideos() {
  mapVideos = new mapboxgl.Map({
    container: 'map-videos',
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#191b2e',
          },
        },
      ],
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    },
    center: [128.0, 36.0],
    zoom: 6.5,
    pitch: 0,
  });

  mapVideos.on('load', async () => {
    await addBaseLayers(mapVideos);
    renderVideoMarkers('approaching');
  });

  mapVideos.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

  // 비디오 태풍 셀렉트 이벤트
  setupCustomSelect('video-typhoon-select', (value) => {
    console.log('Selected typhoon:', value);
    // 여기에 태풍 변경 로직 추가 가능
  });

  // 비디오 탭 버튼 이벤트
  const videoTabBtns = document.querySelectorAll(
    '#tabTyphoon3 .cnt-panel-tab__button'
  );
  videoTabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const videoType = e.target.dataset.videoType;

      videoTabBtns.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');

      renderVideoMarkers(videoType);
      renderVideoSlider(videoType);
    });
  });

  // 초기 슬라이더 렌더링
  renderVideoSlider('approaching');
}

let currentVideoMarkers = [];

function renderVideoMarkers(type) {
  currentVideoMarkers.forEach((marker) => marker.remove());
  currentVideoMarkers = [];

  const filteredMarkers = videoData.filter((m) => m.type === type);

  filteredMarkers.forEach((marker) => {
    const el = document.createElement('div');
    el.className = `video-marker ${marker.type}`;
    el.textContent = marker.number;
    el.style.cssText = `
            width: 40px;
            height: 40px;
            background: rgba(42, 82, 152, 0.9);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            border: 2px solid #fff;
        `;

    const mapboxMarker = new mapboxgl.Marker(el)
      .setLngLat(marker.coord)
      .addTo(mapVideos);

    currentVideoMarkers.push(mapboxMarker);
  });
}

// 비디오 슬라이더 인스턴스 저장
let videoSwiper = null;

// 비디오 슬라이더 렌더링 함수
function renderVideoSlider(type) {
  const slides = document.querySelectorAll('.cnt-video-slider .swiper-slide');

  // 타입에 맞는 슬라이드만 표시
  slides.forEach((slide) => {
    const slideType = slide.getAttribute('data-type');
    if (slideType === type) {
      slide.style.display = '';
    } else {
      slide.style.display = 'none';
    }
  });

  // 기존 슬라이더 파괴 후 재초기화
  if (videoSwiper) {
    videoSwiper.destroy(true, true);
    videoSwiper = null;
  }

  // Swiper 슬라이더 초기화
  videoSwiper = new Swiper('.cnt-video-slider', {
    slidesPerView: 3,
    spaceBetween: 20,
    navigation: {
      nextEl: '.cnt-swiper__button next',
      prevEl: '.cnt-swiper__button prev',
    },
    pagination: {
      el: '.cnt-swiper__pagination',
      clickable: true,
    },
  });
}

function showVideoInfo(marker) {
  const videoInfoContainer = document.getElementById('video-info');
  const typeText = marker.type === 'approaching' ? '접근 기록' : '피해 기록';
  const typeColor = marker.type === 'approaching' ? '#ffa500' : '#ff4444';

  videoInfoContainer.innerHTML = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 15px; font-size: 18px; font-weight: 600;">${marker.title}</h3>
            <div style="margin-bottom: 15px;">
                <span style="
                    display: inline-block;
                    padding: 6px 12px;
                    background: ${typeColor};
                    color: #fff;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                ">${typeText}</span>
            </div>
            <p style="margin-bottom: 15px; color: #6c757d;">해당 지점의 태풍 영상을 확인할 수 있습니다.</p>
            <a href="${marker.url}" target="_blank" style="
                display: inline-block;
                padding: 12px 24px;
                background: #2a5298;
                color: #fff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: all 0.3s ease;
            ">영상 보기</a>
        </div>
    `;
}

// 네비게이션 컨트롤
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// 스케일 컨트롤
map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

// ============================================ //
// 모바일 바텀시트 기능
// ============================================ //
function initializeMobileBottomSheetLayout() {
  if (window.innerWidth > 899) {
    // 데스크탑 뷰로 돌아갈 때 기존 스타일 복원
    document.querySelectorAll('.cnt-info-panel').forEach((panel) => {
      const handle = panel.querySelector('.drag-handle-wrapper');
      if (handle) handle.remove();
      panel.style.height = '';
    });
    return;
  }

  const infoPanels = document.querySelectorAll('.cnt-info-panel');

  infoPanels.forEach((panel) => {
    const handleWrapper = panel.querySelector('.drag-handle-wrapper');
    if (!handleWrapper) return;

    let initialY, initialHeight;
    let mapInstance;

    const tabContent = panel.closest('.cnt-main-tab__content');
    if (!tabContent) return;
    const tabContentId = tabContent.id;

    if (tabContentId === 'tabTyphoon1') mapInstance = map;
    else if (tabContentId === 'tabTyphoon2') mapInstance = mapTop5;
    else if (tabContentId === 'tabTyphoon3') mapInstance = mapVideos;

    const onDragStart = (e) => {
      e.preventDefault();
      panel.style.transition = 'none';
      initialY = e.pageY || e.touches[0].pageY;
      initialHeight = panel.offsetHeight;

      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchend', onDragEnd);
    };

    const onDragMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const currentY = e.pageY || e.touches[0].pageY;
      const deltaY = currentY - initialY;
      let newHeight = initialHeight - deltaY;

      const minHeight = parseFloat(getComputedStyle(panel).minHeight);
      const maxHeight = window.innerHeight * 0.8;

      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      panel.style.height = `${newHeight}px`;
    };

    const onDragEnd = () => {
      panel.style.transition = 'height 0.3s ease';
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchend', onDragEnd);
    };

    handleWrapper.addEventListener('mousedown', onDragStart);
    handleWrapper.addEventListener('touchstart', onDragStart, {
      passive: false,
    });

    // 탭 활성화 시 지도 리사이즈
    const observer = new MutationObserver(() => {
      if (tabContent.classList.contains('active')) {
        if (mapInstance) {
          setTimeout(() => mapInstance.resize(), 50);
        }
      }
    });
    observer.observe(tabContent, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });
}

// 페이지 로드 및 창 크기 변경 시 레이아웃 초기화
document.addEventListener(
  'DOMContentLoaded',
  initializeMobileBottomSheetLayout
);
window.addEventListener('resize', initializeMobileBottomSheetLayout);

// ============================================ //
// 커스텀 셀렉트 공통 함수
// ============================================ //
function setupCustomSelect(selectId, onSelectCallback) {
  const customSelect = document.getElementById(selectId);
  if (!customSelect) return;

  const selectTrigger = customSelect.querySelector(
    '.cnt-custom-select__trigger'
  );
  const options = customSelect.querySelectorAll('.cnt-custom-select__option');

  // 드롭다운 위치 계산 함수
  function calculateDropdownPosition() {
    const rect = customSelect.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 280; // max-height

    // 아래 공간이 부족하고 위 공간이 충분하면 위로 열기
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      customSelect.classList.add('open-upward');
    } else {
      customSelect.classList.remove('open-upward');
    }
  }

  // 드롭다운 열기/닫기
  selectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    // 다른 열린 셀렉트 닫기
    document.querySelectorAll('.cnt-custom-select.open').forEach((sel) => {
      if (sel !== customSelect) {
        sel.classList.remove('open');
        sel.classList.remove('open-upward');
      }
    });

    // 위치 계산
    calculateDropdownPosition();

    customSelect.classList.toggle('open');
  });

  // 옵션 선택
  options.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.getAttribute('data-value');
      const text = option.querySelector(
        '.cnt-custom-select__option-text'
      ).textContent;

      // 선택된 항목 업데이트
      selectTrigger.querySelector('.cnt-custom-select__text').textContent =
        text;

      // 드롭다운 닫기
      customSelect.classList.remove('open');
      customSelect.classList.remove('open-upward');

      // 오버레이 접기
      if (typeof collapseOverlaysOnAction === 'function') {
        collapseOverlaysOnAction();
      }

      // 콜백 실행
      if (onSelectCallback) {
        onSelectCallback(value);
      }
    });
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
      customSelect.classList.remove('open-upward');
    }
  });
}

// ============================================================
// 맵 오버레이 토글 기능
// ============================================================

// 각 탭의 방문 여부 추적
const tabVisited = {
  tabTyphoon1: false,
  tabTyphoon2: false,
  tabTyphoon3: false,
};

// 각 오버레이의 상태 저장
const overlayStates = {
  mapOverlay1: true, // 처음에는 펼쳐진 상태
  mapOverlay2: true,
  mapOverlay3: true,
};

// 오버레이 토글 초기화
function initMapOverlays() {
  const toggleButtons = document.querySelectorAll('.cnt-map-overlay__toggle');
  const overlays = document.querySelectorAll('.cnt-map-overlay');

  toggleButtons.forEach((toggleBtn) => {
    const titleWrap = toggleBtn.closest('.cnt-map-title-wrap');
    if (!titleWrap) return;

    const overlay = titleWrap.querySelector('.cnt-map-overlay');
    if (!overlay) return;

    const overlayId = overlay.id;

    // 토글 버튼 클릭 이벤트
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = overlay.classList.contains('collapsed');

      if (isCollapsed) {
        overlay.classList.remove('collapsed');
        if (overlayId) overlayStates[overlayId] = true;
      } else {
        overlay.classList.add('collapsed');
        if (overlayId) overlayStates[overlayId] = false;
      }
    });
  });

  // 오버레이 컨텐츠 밖 클릭 시 닫기
  document.addEventListener('click', (e) => {
    overlays.forEach((overlay) => {
      const overlayId = overlay.id;
      const isCollapsed = overlay.classList.contains('collapsed');

      const titleWrap = overlay.closest('.cnt-map-title-wrap');

      // 오버레이가 펼쳐져 있고, 클릭한 곳이 오버레이나 토글버튼을 포함하는 래퍼 밖이면 닫기
      if (!isCollapsed && titleWrap && !titleWrap.contains(e.target)) {
        overlay.classList.add('collapsed');
        if (overlayId) overlayStates[overlayId] = false;
      }
    });
  });
}

// 사용자가 액션을 취했을 때 오버레이 접기
function collapseOverlaysOnAction() {
  const overlays = document.querySelectorAll('.cnt-map-overlay');

  overlays.forEach((overlay) => {
    const overlayId = overlay.id;
    overlay.classList.add('collapsed');
    overlayStates[overlayId] = false;
  });
}

// 페이지 로드 시 오버레이 초기화
document.addEventListener('DOMContentLoaded', () => {
  initMapOverlays();
  // 첫 번째 탭은 이미 방문한 것으로 표시
  tabVisited.tabTyphoon1 = true;
});
