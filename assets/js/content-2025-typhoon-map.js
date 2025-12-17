/**
 * @file Mapbox-related logic for the typhoon visualization page.
 * This includes map initialization, data loading, and functions to draw typhoon paths.
 */

// ============================================================
// MAPBOX INITIALIZATION & CONFIG
// ============================================================

// Mapbox Access Token
mapboxgl.accessToken =
  'pk.eyJ1IjoiZGFmZ3QiLCJhIjoiY21pemt3MnByMHM2eTNkcHA0OHB6MzNtZSJ9.LVM0AlMbcmDDlrc5OVgFmg';

/**
 * Main map instance for the first tab.
 * @type {mapboxgl.Map}
 */
/**
 * Gets the appropriate zoom level based on screen size.
 * @param {number} desktopZoom Zoom level for desktop
 * @param {number} mobileZoom Zoom level for mobile
 * @returns {number} The zoom level to use
 */
function getResponsiveZoom(desktopZoom, mobileZoom) {
  return window.innerWidth <= 900 ? mobileZoom : desktopZoom;
}

/**
 * Updates map zoom level responsively based on screen size.
 * @param {mapboxgl.Map} mapInstance The map instance to update
 * @param {number} desktopZoom Zoom level for desktop
 * @param {number} mobileZoom Zoom level for mobile
 */
function updateMapZoomResponsively(mapInstance, desktopZoom, mobileZoom) {
  if (!mapInstance || !mapInstance.loaded()) return;

  const targetZoom = getResponsiveZoom(desktopZoom, mobileZoom);
  const currentZoom = mapInstance.getZoom();

  // 모바일/데스크톱 전환 시에만 줌 조정 (사용자가 수동으로 줌을 많이 변경하지 않은 경우)
  const zoomDiff = Math.abs(currentZoom - targetZoom);
  if (zoomDiff > 0.5) {
    mapInstance.easeTo({
      zoom: targetZoom,
      duration: 500,
    });
  }
}

// 모바일에서는 줌 레벨을 낮춰서 더 넓게 보이도록 설정
const initialZoom = getResponsiveZoom(6, 5);

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
  zoom: initialZoom,
  pitch: 0,
});

/**
 * Map instance for the "Top 5 Typhoons" tab. Initialized in initMapTop5().
 * @type {mapboxgl.Map | null}
 */
let mapTop5 = null;

/**
 * Map instance for the "Typhoon Videos" tab. Initialized in initMapVideos().
 * @type {mapboxgl.Map | null}
 */
let mapVideos = null;

// ============================================================
// TYPHOON DATA
// ============================================================

/**
 * 태풍 색상 상수
 */
const TYPHOON_COLORS = {
  SARAH: '#ffa07a', // 사라 - 주황
  PRAPIROON: '#4ecdc4', // 뿌라삐롱 - 청록
  RUSA: '#ff6b6b', // 루사 - 빨강
  MAEMI: '#74b9ff', // 매미 - 파랑
  NARI: '#ff9cee', // 나리 - 분홍
  BOLAVEN: '#95e1d3', // 볼라벤&덴빈 - 민트
  CHABA: '#ffd93d', // 차바 - 노랑
};

/**
 * Data for the currently active typhoon.
 * Set to null if there is no active typhoon.
 */
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
// const currentTyphoon = null; // 현재 태풍 없을 시

/**
 * Historical typhoon data.
 * HTML 셀렉트 박스 순서와 동일하게 정렬
 * @type {Array<Object>}
 */
const typhoons = [
  {
    name: '사라',
    nameEn: 'SARAH',
    number: '14',
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
    color: TYPHOON_COLORS.SARAH,
    category: '초강력',
    description:
      '1959년 태풍 사라는 관측 이래 최대 규모의 태풍으로, 최저기압 최저기압(950hpa)과 초속 85m/sec의 강풍 및 폭우로 평상복도에 막대한 피해를 입혔습니다.',
  },
  {
    name: '뿌라삐롱',
    nameEn: 'PRAPIROON',
    number: '12',
    year: 2000,
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
    color: TYPHOON_COLORS.PRAPIROON,
    category: '매우강',
  },
  {
    name: '루사',
    nameEn: 'RUSA',
    number: '15',
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
    color: TYPHOON_COLORS.RUSA,
    category: '초강력',
    description:
      '이 태풍은 3,382명의 인명피해와 2,490억 원의 재산피해(2003년 기준)를 가져왔으며, 당시 가장 오랜 인류 피해 규모가 더욱 커졌던 대표적인 재난으로 남아있습니다.',
  },
  {
    name: '매미',
    nameEn: 'MAEMI',
    number: '14',
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
    color: TYPHOON_COLORS.MAEMI,
    category: '초강력',
  },
  {
    name: '나리',
    nameEn: 'NARI',
    number: '11',
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
    color: TYPHOON_COLORS.NARI,
    category: '매우강',
  },
  {
    name: '볼라벤&덴빈',
    nameEn: 'BOLAVEN&TEMBIN',
    number: '14&15',
    year: 2012,
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
    color: TYPHOON_COLORS.BOLAVEN,
    category: '강',
  },
  {
    name: '차바',
    nameEn: 'CHABA',
    number: '18',
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
    color: TYPHOON_COLORS.CHABA,
    category: '초강력',
  },
];

/** Data for Top 5 tab */
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

/** Data for video markers tab */
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

// ============================================================
// MAP LOADING & INITIALIZATION
// ============================================================

map.on('load', async () => {
  // Load custom SVG icons for typhoon markers
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

/**
 * Fallback for missing images. Creates a placeholder.
 */
map.on('styleimagemissing', (e) => {
  const id = e.id;
  console.warn(`Missing image: ${id}, creating placeholder`);

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
  ctx.fillStyle = '#FF6B6B';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  map.addImage(id, canvas);
});

/**
 * Initializes the main map after all assets are loaded.
 */
async function initializeMap() {
  await addBaseLayers(map);

  if (currentTyphoon) {
    addCurrentTyphoonToMap(currentTyphoon);
  }

  typhoons.forEach((typhoon, index) => {
    addTyphoonToMap(typhoon, index, false);
  });

  // 팝업 닫기 이벤트 설정
  setupPopupCloseEvents();

  // UI-related functions are called from content-2025-typhoon-ui.js
  // This ensures all map layers are ready before UI scripts try to access them.
}

// ============================================================
// MAP DRAWING & HELPER FUNCTIONS
// ============================================================

/**
 * Adds base layers (land and South Korea outline) to a map instance.
 * @param {mapboxgl.Map} mapInstance The map to add layers to.
 */
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

    if (!mapInstance.getSource('world-land')) {
      mapInstance.addSource('world-land', { type: 'geojson', data: landData });
    }
    if (!mapInstance.getSource('south-korea')) {
      mapInstance.addSource('south-korea', {
        type: 'geojson',
        data: koreaData,
      });
    }

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

/**
 * Sets the opacity for a map layer (supports symbol and circle types).
 * @param {string} layerId The ID of the layer.
 * @param {number} opacity The opacity value (0-1).
 */
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

/**
 * Adds the current typhoon's path, wind radii, and markers to the map.
 * @param {Object} typhoon The current typhoon data object.
 */
function addCurrentTyphoonToMap(typhoon) {
  if (!typhoon) return;

  const pathCoords = typhoon.path.map((p) => p.coord);
  const currentPos = typhoon.currentPosition;

  // Past path (dashed line)
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
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#FF4444',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 1,
    },
  });

  // Wind radius areas (15m/s and 25m/s)
  const currentPoint = typhoon.path[currentPos];
  map.addSource('wind-area-15', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: currentPoint.coord },
      properties: { radius: currentPoint.windRadius15 },
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

  map.addSource('wind-area-25', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: currentPoint.coord },
      properties: { radius: currentPoint.windRadius25 },
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

  // Path markers (past, current, future)
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
      geometry: { type: 'Point', coordinates: point.coord },
    })),
  };
  map.addSource('typhoon-points-current', {
    type: 'geojson',
    data: pointsData,
  });
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
    paint: { 'icon-opacity': 1 },
  });

  // Probability area for future path
  const futurePoints = typhoon.path.filter((_, idx) => idx > currentPos);
  futurePoints.forEach((point, idx) => {
    const sourceId = `probability-area-${idx}`;
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: point.coord },
      },
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

  // Time labels
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

/**
 * Adds a historical typhoon's path and markers to the map.
 * @param {Object} typhoon The typhoon data object.
 * @param {number} index The index of the typhoon in the `typhoons` array.
 * @param {boolean} isVisible Whether the path should be initially visible.
 */
function addTyphoonToMap(typhoon, index, isVisible) {
  // Add path line
  map.addSource(`typhoon-route-${index}`, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: { name: typhoon.name, year: typhoon.year },
      geometry: { type: 'LineString', coordinates: typhoon.path },
    },
  });
  map.addLayer({
    id: `typhoon-route-${index}`,
    type: 'line',
    source: `typhoon-route-${index}`,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': typhoon.color,
      'line-width': 2,
      'line-opacity': isVisible ? 1 : 0,
    },
  });

  // Add path points
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
      geometry: { type: 'Point', coordinates: coord },
    })),
  };
  map.addSource(`typhoon-points-${index}`, {
    type: 'geojson',
    data: pointsData,
  });
  map.addLayer({
    id: `typhoon-points-${index}`,
    type: 'circle',
    source: `typhoon-points-${index}`,
    paint: {
      'circle-radius': 5,
      'circle-color': '#282828', // 원 배경은 어두운 회색
      'circle-stroke-width': 1.5,
      'circle-stroke-color': typhoon.color, // 보더는 태풍 컬러
      'circle-opacity': isVisible ? 0.9 : 0,
      'circle-stroke-opacity': isVisible ? 0.9 : 0,
    },
  });

  // Add click event for popup
  map.on('click', `typhoon-points-${index}`, (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const infoPanel = document.getElementById('typhoon-info-panel');
    if (!infoPanel) return;

    // Update existing panel content
    const colorIndicator = infoPanel.querySelector('.cnt-color-indicator');
    const titleText = infoPanel.querySelector('.cnt-map-popup__title-text');
    const dateValue = infoPanel.querySelector('.cnt-map-popup__date-value');
    const infoValues = infoPanel.querySelectorAll('.cnt-map-popup__info-value');

    if (colorIndicator) colorIndicator.style.backgroundColor = typhoon.color;
    if (titleText) titleText.textContent = `${typhoon.name}(${typhoon.year})`;
    if (dateValue) dateValue.textContent = `${typhoon.year}년`;
    if (infoValues[0]) infoValues[0].textContent = `${typhoon.wind} m/s`;
    if (infoValues[1]) infoValues[1].textContent = `${typhoon.pressure} hPa`;
    if (infoValues[2]) infoValues[2].textContent = `${typhoon.windRadius} km`;

    // PC와 모바일에 따라 다른 지도 이동 설정
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      // 모바일: 중앙에 위치, 적당한 줌
      map.flyTo({
        center: coordinates,
        zoom: 7,
        duration: 1500,
      });

      // 모바일: 팝업을 화면 중앙에 고정
      setTimeout(() => {
        infoPanel.style.position = 'absolute';
        infoPanel.style.top = '50%';
        infoPanel.style.left = '50%';
        infoPanel.style.transform = 'translate(-50%, -50%)';
        infoPanel.style.display = 'block';
      }, 1600);
    } else {
      // PC: 마커를 왼쪽 영역 중앙에 위치시켜 오른쪽 패널과 겹치지 않도록
      const offset = [-200, 0]; // x: 왼쪽으로 200px 이동하여 왼쪽 영역 중앙에 배치
      map.flyTo({
        center: coordinates,
        zoom: 6.5,
        offset: offset,
        duration: 1500,
      });

      // PC: 팝업을 마커 바로 위에 위치시키기 (flyTo 완료 후)
      setTimeout(() => {
        const point = map.project(coordinates);
        const popupWidth = infoPanel.offsetWidth || 350;
        const popupHeight = infoPanel.offsetHeight || 200;

        // 마커 위쪽에 팝업 배치 (마커 중심 기준)
        infoPanel.style.position = 'absolute';
        infoPanel.style.left = `${point.x - popupWidth / 2}px`;
        infoPanel.style.top = `${point.y - popupHeight - 20}px`; // 마커 위 20px 간격
        infoPanel.style.transform = 'none';
        infoPanel.style.display = 'block';
      }, 1600);
    }
  });

  // Change cursor on hover
  map.on('mouseenter', `typhoon-points-${index}`, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', `typhoon-points-${index}`, () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Animates a typhoon path drawing on the map.
 * @param {number} routeIndex The index of the typhoon to animate.
 */
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

  // Calculate segment lengths for smooth interpolation
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

// ============================================ //
// 탭2: TOP 5 태풍 맵
// ============================================ //

/**
 * Initializes the map for the "Top 5 Typhoons" tab.
 */
function initMapTop5(onLoadCallback) {
  // 모바일에서는 줌 레벨을 낮춰서 더 넓게 보이도록 설정
  const initialZoom = getResponsiveZoom(5.5, 4.5);

  mapTop5 = new mapboxgl.Map({
    container: 'map-top5',
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#191b2e' },
        },
      ],
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    },
    center: [128.0, 36.0],
    zoom: initialZoom,
    pitch: 0,
  });

  mapTop5.on('load', async () => {
    await addBaseLayers(mapTop5);
    if (onLoadCallback) {
      onLoadCallback();
    }
  });

  // 지도 컨트롤 비활성화
  // mapTop5.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
}

/**
 * Renders the paths for the top 5 typhoons on its dedicated map.
 * @param {Array<Object>} data The sorted and sliced array of top 5 typhoons.
 */
function renderTop5Map(data) {
  if (!mapTop5) return;

  // Clear existing layers and sources
  for (let i = 0; i < 5; i++) {
    if (mapTop5.getLayer(`top5-route-${i}`))
      mapTop5.removeLayer(`top5-route-${i}`);
    if (mapTop5.getLayer(`top5-label-${i}`))
      mapTop5.removeLayer(`top5-label-${i}`);
    if (mapTop5.getSource(`top5-route-${i}`))
      mapTop5.removeSource(`top5-route-${i}`);
    if (mapTop5.getSource(`top5-label-point-${i}`))
      mapTop5.removeSource(`top5-label-point-${i}`);
  }

  function animateLine(source, fullPath, duration, callback) {
    if (!source) return;
    let startTime = performance.now();
    function frame(timestamp) {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentPointIndex = Math.floor(progress * (fullPath.length - 1));
      const currentPath = fullPath.slice(0, currentPointIndex + 1);
      if (progress < 1 && currentPointIndex < fullPath.length - 1) {
        const segmentProgress =
          progress * (fullPath.length - 1) - currentPointIndex;
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
      if (progress < 1) requestAnimationFrame(frame);
      else {
        source.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: fullPath },
        });
        if (callback) callback();
      }
    }
    requestAnimationFrame(frame);
  }

  data.forEach((typhoon, index) => {
    if (!typhoon || !typhoon.path || typhoon.path.length === 0) return;
    const color = top5Colors[index];
    const routeSourceId = `top5-route-${index}`;
    const labelSourceId = `top5-label-point-${index}`;

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
      paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.8 },
    });
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

    setTimeout(() => {
      const source = mapTop5.getSource(routeSourceId);
      animateLine(source, typhoon.path, 1500, () => {
        const labelSource = mapTop5.getSource(labelSourceId);
        if (labelSource)
          labelSource.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: typhoon.path },
            properties: {
              name: `${index + 1}위 ${typhoon.year}년 ${typhoon.name}`,
            },
          });
      });
    }, index * 200);
  });
}

// ============================================ //
// 탭3: 영상 마커 맵
// ============================================ //

let currentVideoMarkers = [];

/**
 * Initializes the map for the "Typhoon Videos" tab.
 */
function initMapVideos() {
  // 모바일에서는 줌 레벨을 낮춰서 더 넓게 보이도록 설정
  const initialZoom = getResponsiveZoom(6.5, 5.5);

  mapVideos = new mapboxgl.Map({
    container: 'map-videos',
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#191b2e' },
        },
      ],
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    },
    center: [128.0, 36.0],
    zoom: initialZoom,
    pitch: 0,
  });

  mapVideos.on('load', async () => {
    await addBaseLayers(mapVideos);
    renderVideoMarkers('approaching');
  });

  // 지도 컨트롤 비활성화
  //mapVideos.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
}

/**
 * Renders video location markers on its dedicated map using GeoJSON layers.
 * @param {'approaching' | 'damage'} type The type of videos to display.
 */
function renderVideoMarkers(type) {
  if (!mapVideos) return;

  // 기존 레이어와 소스 제거
  if (mapVideos.getLayer('video-markers')) {
    mapVideos.removeLayer('video-markers');
  }
  if (mapVideos.getLayer('video-markers-labels')) {
    mapVideos.removeLayer('video-markers-labels');
  }
  if (mapVideos.getSource('video-markers')) {
    mapVideos.removeSource('video-markers');
  }

  // 필터링된 비디오 데이터
  const filteredVideos = videoData.filter((m) => m.type === type);

  if (filteredVideos.length === 0) return;

  // GeoJSON 데이터 생성
  const markersData = {
    type: 'FeatureCollection',
    features: filteredVideos.map((video, index) => ({
      type: 'Feature',
      properties: {
        number: index + 1,
        title: video.title,
        date: video.date,
        thumbnail: video.thumbnail,
        url: video.url,
        type: video.type,
      },
      geometry: {
        type: 'Point',
        coordinates: video.coord,
      },
    })),
  };

  // 소스 추가
  mapVideos.addSource('video-markers', {
    type: 'geojson',
    data: markersData,
  });

  // 마커 원형 레이어 추가
  mapVideos.addLayer({
    id: 'video-markers',
    type: 'circle',
    source: 'video-markers',
    paint: {
      'circle-radius': 20,
      'circle-color': type === 'approaching' ? '#E96B06' : '#DC1011',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });

  // 숫자 레이블 레이어 추가
  mapVideos.addLayer({
    id: 'video-markers-labels',
    type: 'symbol',
    source: 'video-markers',
    layout: {
      'text-field': ['get', 'number'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 18,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#ffffff',
    },
  });

  // 클릭 이벤트 추가
  mapVideos.on('click', 'video-markers', (e) => {
    const properties = e.features[0].properties;

    // Create and dispatch a custom event
    const event = new CustomEvent('markerClick', {
      detail: {
        slideIndex: properties.number - 1, // `number` is 1-based, slide index is 0-based
      },
    });
    window.dispatchEvent(event);
  });

  // 마우스 커서 변경
  mapVideos.on('mouseenter', 'video-markers', () => {
    mapVideos.getCanvas().style.cursor = 'pointer';
  });

  mapVideos.on('mouseleave', 'video-markers', () => {
    mapVideos.getCanvas().style.cursor = '';
  });
}

// ============================================ //
// MAP CONTROLS
// ============================================ //
// 지도 컨트롤 비활성화
//map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
//map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

// ============================================ //
// POPUP CLOSE EVENTS
// ============================================ //
/**
 * 팝업 닫기 이벤트 설정
 */
function setupPopupCloseEvents() {
  const infoPanel = document.getElementById('typhoon-info-panel');
  if (!infoPanel) return;

  // X 버튼 클릭으로 닫기
  const closeBtn = infoPanel.querySelector('.panel-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      infoPanel.style.display = 'none';
    });
  }

  // 지도의 빈 공간(마커가 아닌 곳) 클릭 시 팝업 닫기
  map.on('click', (e) => {
    // 마커를 클릭하지 않은 경우 (빈 지도를 클릭한 경우)
    const features = map.queryRenderedFeatures(e.point);
    const isMarkerClick = features.some((f) =>
      f.layer.id.includes('typhoon-points')
    );

    if (!isMarkerClick && infoPanel.style.display === 'block') {
      infoPanel.style.display = 'none';
    }
  });

  // 팝업 외부(지도 밖) 클릭 시 닫기
  document.addEventListener('click', (e) => {
    // 지도 영역을 클릭한 경우는 위의 map.on('click')에서 처리
    const isMapClick =
      e.target.closest('.mapboxgl-canvas-container') ||
      e.target.classList.contains('mapboxgl-canvas');

    if (isMapClick) return;

    // 팝업이 열려있고, 클릭한 곳이 팝업 내부가 아닌 경우
    if (infoPanel.style.display === 'block' && !infoPanel.contains(e.target)) {
      infoPanel.style.display = 'none';
    }
  });
}
