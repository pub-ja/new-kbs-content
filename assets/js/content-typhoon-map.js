/**
 * @file 태풍 시각화 페이지의 Mapbox 관련 로직
 * 지도 초기화 및 태풍 경로 그리기 함수 포함
 *
 * ============================================================
 * [개발 전달 가이드]
 * ============================================================
 *
 * 1. 파일 구조:
 *    - content-typhoon-data.js: Mock 데이터 (API 연동 시 삭제)
 *    - content-typhoon-map.js: 지도 로직 (현재 파일)
 *    - content-typhoon-ui.js: UI 및 사용자 인터랙션
 *
 * 2. Mapbox 의존성:
 *    - mapboxgl 라이브러리 필수
 *    - Access Token 교체 필요 (아래 참조)
 *
 * 3. 외부 GeoJSON 의존성:
 *    - Natural Earth 육지 데이터
 *    - 한국 행정구역 데이터
 *    - 네트워크 오류 시 대체 방안 필요
 *
 * 4. 주요 함수:
 *    - initializeMap(): 메인 맵 초기화
 *    - initMapTop5(): Top5 맵 초기화
 *    - initMapVideos(): 비디오 맵 초기화
 *    - addTyphoonToMap(): 태풍 경로 추가
 *    - renderTop5Map(): Top5 태풍 렌더링
 *    - renderVideoMarkers(): 영상 마커 렌더링
 */

// ============================================================
// MAPBOX 초기화 및 설정
// ============================================================

// [중요] Mapbox Access Token - 실제 프로덕션 토큰으로 교체 필요
mapboxgl.accessToken =
  'pk.eyJ1IjoiZGFmZ3QiLCJhIjoiY21pemt3MnByMHM2eTNkcHA0OHB6MzNtZSJ9.LVM0AlMbcmDDlrc5OVgFmg';

// 상수
const MOBILE_BREAKPOINT = 900; // px
const ZOOM_LEVELS = {
  MAIN: { desktop: 6, mobile: 5 },
  TOP5: { desktop: 5.5, mobile: 4.5 },
  VIDEOS: { desktop: 6.5, mobile: 5.5 },
};

// 활성 마커 추적
let activeMarkerId = null;
let activeVideoMarkerId = null;

/**
 * 화면 크기에 따라 적절한 줌 레벨을 반환
 * @param {number} desktopZoom 데스크톱 줌 레벨
 * @param {number} mobileZoom 모바일 줌 레벨
 * @returns {number} 사용할 줌 레벨
 */
function getResponsiveZoom(desktopZoom, mobileZoom) {
  return window.innerWidth <= MOBILE_BREAKPOINT ? mobileZoom : desktopZoom;
}

/**
 * 기본 맵 스타일 설정 생성
 * @returns {Object} Mapbox 스타일 객체
 */
function createMapStyle() {
  return {
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
  };
}

// 모바일에서는 줌 레벨을 낮춰서 더 넓게 보이도록 설정
const initialZoom = getResponsiveZoom(
  ZOOM_LEVELS.MAIN.desktop,
  ZOOM_LEVELS.MAIN.mobile
);

/**
 * ============================================================
 * [Mapbox Studio 연동 가이드] 현재 태풍 레이어
 * ============================================================
 *
 * 📌 현재 방식: JavaScript에서 직접 스타일 정의
 * - style: { version: 8, sources: {}, layers: [...] }
 * - 장점: 모든 것을 코드로 제어 가능
 * - 단점: 스타일 수정 시 코드 수정 필요
 *
 * 📌 Studio 연동 방식 (권장):
 * 1. Mapbox Studio에서 현재 태풍 레이어 생성 및 스타일링
 * 2. 스타일 URL 복사: mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID
 * 3. 아래 style 속성을 Studio URL로 변경:
 *
 * const map = new mapboxgl.Map({
 *   container: 'map',
 *   style: 'mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID',  // ← Studio 스타일 URL
 *   center: [128.0, 36.0],
 *   zoom: initialZoom,
 *   pitch: 0,
 * });
 *
 * 📌 Studio 레이어 + JavaScript 역대 태풍 레이어 조합:
 * - Studio: 현재 태풍 레이어 (항상 표시)
 * - JavaScript: 역대 태풍 레이어 (선택 시 표시)
 *
 * map.on('load', () => {
 *   // Studio 레이어는 자동으로 로드됨
 *
 *   // 역대 태풍만 JavaScript로 추가
 *   typhoons.forEach((typhoon, index) => {
 *     addTyphoonToMap(typhoon, index, false);
 *   });
 *
 *   // 레이어 순서 조정 (선택사항)
 *   // Studio의 현재 태풍 레이어 이름이 'current-typhoon-layer'라고 가정
 *   typhoons.forEach((_, index) => {
 *     // 역대 태풍을 현재 태풍 아래에 배치하려면:
 *     map.moveLayer(`typhoon-route-${index}`, 'current-typhoon-layer');
 *     map.moveLayer(`typhoon-points-${index}`, 'current-typhoon-layer');
 *   });
 * });
 *
 * 📌 Studio 레이어 제어 (JavaScript에서):
 * - 숨기기: map.setPaintProperty('current-typhoon-layer', 'line-opacity', 0);
 * - 보이기: map.setPaintProperty('current-typhoon-layer', 'line-opacity', 1);
 * - 클릭: map.on('click', 'current-typhoon-layer', (e) => { ... });
 * - 모든 기능 동일하게 작동 (zoom, fitBounds, 애니메이션 등)
 *
 * 📌 필수 Studio 레이어 이름 규칙:
 * - renderCurrentTyphoon() 함수에서 사용하는 레이어 ID와 일치 필요
 * - 예: 'current-typhoon-route', 'current-typhoon-points' 등
 */
const map = new mapboxgl.Map({
  container: 'map',
  style: createMapStyle(),
  center: [128.0, 36.0],
  zoom: initialZoom,
  pitch: 0,
});

/**
 * "Top 5 태풍" 탭의 맵 인스턴스 (initMapTop5()에서 초기화됨)
 * @type {mapboxgl.Map | null}
 */
let mapTop5 = null;

/**
 * "영상 아카이브" 탭의 맵 인스턴스 (initMapVideos()에서 초기화됨)
 * @type {mapboxgl.Map | null}
 */
let mapVideos = null;

// ============================================================
// 데이터 임포트
// ============================================================
// Mock 데이터는 content-typhoon-data.js에서 불러옴
// API 연동 시 해당 파일 삭제하고 API 호출로 대체

// ============================================================
// 지도 로딩 및 초기화
// ============================================================

map.on('load', async () => {
  // 로컬 CORS 문제 방지를 위해 Data URI를 사용하여 커스텀 SVG 아이콘 로드
  // Mild(온대저기압): Orange (#ff6600), Strong(강력): Red (#ff0000)
  const icons = [
    {
      name: 'typhoon-td',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23"><circle cx="11.5" cy="11.5" r="10" fill="white" stroke="#333" stroke-width="2"/><path stroke="#333" stroke-width="2" fill="none" d="M6 6L17 17M17 6L6 17"/></svg>',
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
            // 미리 색상이 지정된 SVG를 사용하므로 SDF=false로 이미지 추가
            map.addImage(icon.name, img);
            console.log(`✓ ${icon.name} 로드 성공`);
          }
          resolve();
        };
        img.onerror = (error) => {
          console.error(`${icon.name} 로드 실패:`, error);
          reject(error);
        };
        // CORS 우회를 위해 SVG 문자열을 Base64로 인코딩
        const encodedSvg =
          'data:image/svg+xml;base64,' +
          btoa(unescape(encodeURIComponent(icon.svg)));
        img.src = encodedSvg;
      });
    } catch (error) {
      console.error(`✗ ${icon.name} 로드 불가:`, error);
    }
  }

  console.log('아이콘 로드 완료, 지도 초기화 중...');
  initializeMap();
});

/**
 * 이미지 누락 시 폴백 처리 (플레이스홀더 생성)
 */
map.on('styleimagemissing', (e) => {
  const id = e.id;
  console.warn(`이미지 누락: ${id}, 플레이스홀더 생성`);

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
 * 모든 에셋 로드 후 메인 맵 초기화
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

  // UI 관련 함수는 content-typhoon-ui.js에서 호출
  // 이를 통해 UI 스크립트가 접근하기 전에 모든 지도 레이어가 준비됨
}

// ============================================================
// 지도 그리기 및 헬퍼 함수
// ============================================================

/**
 * 베이스 레이어(육지 및 한국 행정구역 경계선)를 맵 인스턴스에 추가
 * @param {mapboxgl.Map} mapInstance 레이어를 추가할 맵
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
      throw new Error('지도 데이터 가져오기 실패');
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
    console.error('베이스 맵 로딩 오류:', error);
  }
}

/**
 * 맵 레이어의 투명도 설정 (symbol 및 circle 타입 지원)
 * @param {string} layerId 레이어 ID
 * @param {number} opacity 투명도 값 (0-1)
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
 * 현재 태풍의 경로, 강풍 반경, 마커를 지도에 추가
 * Mapbox 네이티브 방식: symbol 레이어와 icon-rotate 속성을 사용한 애니메이션
 * @param {Object} typhoon 현재 태풍 데이터 객체
 */
function addCurrentTyphoonToMap(typhoon) {
  if (!typhoon) return;

  const pathCoords = typhoon.path.map((p) => p.coord);
  const currentPos = typhoon.currentPosition;
  const currentPoint = typhoon.path[currentPos];

  // 1. 과거 경로 (지나온 길) - 실선
  const pastCoords = pathCoords.slice(0, currentPos + 1);
  map.addSource('typhoon-route-current-past', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: pastCoords },
    },
  });
  map.addLayer({
    id: 'typhoon-route-current-past',
    type: 'line',
    source: 'typhoon-route-current-past',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#353578',
      'line-width': 3,
      'line-opacity': 0.8,
    },
  });

  // 2. 미래 경로 (예상 경로) - 점선
  const futureCoords = pathCoords.slice(currentPos);
  if (futureCoords.length > 1) {
    map.addSource('typhoon-route-current-future', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: futureCoords },
      },
    });
    map.addLayer({
      id: 'typhoon-route-current-future',
      type: 'line',
      source: 'typhoon-route-current-future',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#FF4444',
        'line-width': 2.5,
        'line-dasharray': [2, 3],
        'line-opacity': 0.6,
      },
    });
  }

  // 3. 강풍 반경
  // 반경을 더 크게 보이도록 stops 값 조정
  map.addSource('wind-area-25', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: currentPoint.coord },
    },
  });
  map.addLayer({
    id: 'wind-area-25',
    type: 'circle',
    source: 'wind-area-25',
    paint: {
      'circle-radius': {
        stops: [
          [5, currentPoint.windRadius25 / 5],
          [10, currentPoint.windRadius25 * 0.8], // 줌이 커지면 훨씬 크게
        ],
        base: 2,
      },
      'circle-color': '#FF4500',
      'circle-opacity': 0.35,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FF4500',
    },
  });

  map.addSource('wind-area-15', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: currentPoint.coord },
    },
  });
  map.addLayer({
    id: 'wind-area-15',
    type: 'circle',
    source: 'wind-area-15',
    paint: {
      'circle-radius': {
        stops: [
          [5, currentPoint.windRadius15 / 5],
          [10, currentPoint.windRadius15 * 0.8], // 줌이 커지면 훨씬 크게
        ],
        base: 2,
      },
      'circle-color': '#FFD700',
      'circle-opacity': 0.2,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFD700',
    },
  });

  // 4. 과거/미래 마커
  const otherPoints = typhoon.path.map((point, idx) => ({
    type: 'Feature',
    properties: {
      time: point.time,
      isCurrent: idx === currentPos,
      isPast: idx < currentPos,
      isFuture: idx > currentPos,
    },
    geometry: { type: 'Point', coordinates: point.coord },
  }));

  map.addSource('typhoon-points-current', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: otherPoints },
  });

  // 과거/미래 심볼 (현재 위치 제외)
  map.addLayer({
    id: 'typhoon-points-current-others',
    type: 'symbol',
    source: 'typhoon-points-current',
    filter: ['!=', ['get', 'isCurrent'], true],
    layout: {
      'icon-image': ['case', ['get', 'isPast'], 'typhoon-past', 'typhoon-td'],
      'icon-size': 0.2,
      'icon-allow-overlap': true,
    },
    paint: { 'icon-opacity': 0.7 },
  });

  // 5. 현재 태풍의 눈 (회전 애니메이션)
  map.addLayer({
    id: 'typhoon-eye-current',
    type: 'symbol',
    source: 'typhoon-points-current',
    filter: ['==', ['get', 'isCurrent'], true],
    layout: {
      'icon-image': 'typhoon-strong', // 위에서 로드한 assets 이미지 사용
      'icon-size': 0.3,
      'icon-allow-overlap': true,
      'icon-rotate': 0, // 초기 각도
      'icon-rotation-alignment': 'map', // 지도 방향에 고정
    },
  });

  // 회전 애니메이션 루프
  let rotateAngle = 0;
  function stepRotate() {
    rotateAngle = (rotateAngle + 8) % 360; // 회전 속도 조절
    if (map.getLayer('typhoon-eye-current')) {
      map.setLayoutProperty('typhoon-eye-current', 'icon-rotate', rotateAngle);
      requestAnimationFrame(stepRotate);
    }
  }
  requestAnimationFrame(stepRotate);

  // 6. 시간 라벨
  map.addLayer({
    id: 'typhoon-points-current-labels',
    type: 'symbol',
    source: 'typhoon-points-current',
    layout: {
      'text-field': ['get', 'time'],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 2],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1.5,
    },
  });

  // 레이어 순서 정리 (뒤 -> 앞 순서)
  // 1. 경로 선
  if (map.getLayer('typhoon-route-current-future'))
    map.moveLayer('typhoon-route-current-future');
  map.moveLayer('typhoon-route-current-past');

  // 2. 반경 원
  map.moveLayer('wind-area-15');
  map.moveLayer('wind-area-25');

  // 3. 아이콘 - 선과 반경 위에 그려짐
  map.moveLayer('typhoon-points-current-others');
  map.moveLayer('typhoon-eye-current'); // 현재 태풍 눈이 가장 중요

  // 4. 텍스트 라벨 - 가장 위
  map.moveLayer('typhoon-points-current-labels');
}

/**
 * 역대 태풍의 경로와 마커를 지도에 추가
 * @param {Object} typhoon 태풍 데이터 객체
 * @param {number} index typhoons 배열에서의 인덱스
 * @param {boolean} isVisible 경로를 처음에 표시할지 여부
 */
function addTyphoonToMap(typhoon, index, isVisible) {
  // 경로 좌표 추출 (객체 배열 또는 단순 배열 모두 처리)
  const pathCoordinates = typhoon.path.map((p) =>
    Array.isArray(p) ? p : p.coord
  );

  // 경로 선 추가
  map.addSource(`typhoon-route-${index}`, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: { name: typhoon.name, year: typhoon.year },
      geometry: { type: 'LineString', coordinates: pathCoordinates },
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

  // 경로 지점 추가
  const pointsData = {
    type: 'FeatureCollection',
    features: typhoon.path.map((item, pointIndex) => {
      const coord = Array.isArray(item) ? item : item.coord;
      return {
        type: 'Feature',
        properties: {
          name: typhoon.name,
          year: typhoon.year,
          index: index,
          pointIndex: pointIndex,
          // 객체 배열인 경우 추가 정보도 properties에 포함
          ...(item.wind && { wind: item.wind }),
          ...(item.pressure && { pressure: item.pressure }),
          ...(item.windRadius && { windRadius: item.windRadius }),
          ...(item.time && { time: item.time }),
          ...(item.image && { image: item.image }),
        },
        geometry: { type: 'Point', coordinates: coord },
      };
    }),
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

  // 활성 아웃라인 레이어 추가 (처음엔 숨김, pointIndex로 필터링)
  map.addLayer({
    id: `typhoon-points-${index}-active`,
    type: 'circle',
    source: `typhoon-points-${index}`,
    filter: ['==', 'pointIndex', -1], // 처음엔 아무것도 안 보임 (index -1인 지점 없음)
    paint: {
      'circle-radius': 8,
      'circle-color': 'transparent',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#58FFDE',
      'circle-opacity': 1,
      'circle-stroke-opacity': 0.9,
    },
  });

  // 마커를 다른 모든 레이어 위에 배치
  map.moveLayer(`typhoon-route-${index}`);
  map.moveLayer(`typhoon-points-${index}`);
  map.moveLayer(`typhoon-points-${index}-active`);

  // 팝업을 위한 클릭 이벤트 추가
  map.on('click', `typhoon-points-${index}`, (e) => {
    const clickedMarkerId = `typhoon-points-${index}`;
    const clickedPointIndex = e.features[0].properties.pointIndex;

    // 이전 마커의 활성 상태 제거 (필터 리셋)
    if (activeMarkerId && activeMarkerId !== clickedMarkerId) {
      map.setFilter(`${activeMarkerId}-active`, ['==', 'pointIndex', -1]);
    }

    // 클릭한 마커의 활성 상태 설정 (클릭한 지점만 표시)
    activeMarkerId = clickedMarkerId;
    map.setFilter(`${clickedMarkerId}-active`, [
      '==',
      'pointIndex',
      clickedPointIndex,
    ]);
    const coordinates = e.features[0].geometry.coordinates.slice();
    const infoPanel = document.getElementById('typhoonInfoPanel');
    if (!infoPanel) return;

    // 기존 패널 내용 업데이트
    const colorIndicator = infoPanel.querySelector('.cnt-color-indicator');
    const titleText = infoPanel.querySelector('.cnt-map-popup__title-text');
    const dateValue = infoPanel.querySelector('.cnt-map-popup__date-value');
    const infoValues = infoPanel.querySelectorAll('.cnt-map-popup__info-value');

    // 클릭한 마커의 properties에서 데이터 가져오기 (지점별 데이터)
    const clickedFeature = e.features[0];
    const props = clickedFeature.properties;

    if (colorIndicator) colorIndicator.style.backgroundColor = typhoon.color;
    if (titleText) titleText.textContent = `${typhoon.name}(${typhoon.year})`;

    // 지점별 시간 정보가 있으면 표시, 없으면 연도만
    if (dateValue) {
      dateValue.textContent = props.time || `${typhoon.year}년`;
    }

    // 지점별 데이터 우선, 없으면 태풍 전체 데이터 사용
    if (infoValues[0]) {
      infoValues[0].textContent = `${props.wind || typhoon.wind} m/s`;
    }
    if (infoValues[1]) {
      infoValues[1].textContent = `${props.pressure || typhoon.pressure} hPa`;
    }
    if (infoValues[2]) {
      infoValues[2].textContent = `${props.windRadius || typhoon.windRadius} km`;
    }

    // 이미지 처리
    const imageContainer = infoPanel.querySelector('.cnt-map-popup__image');
    const imageElement = imageContainer
      ? imageContainer.querySelector('img')
      : null;

    if (props.image && imageElement) {
      imageElement.src = props.image;
      imageContainer.style.display = 'block'; // 보이도록 설정
    } else if (imageContainer) {
      imageContainer.style.display = 'none'; // 이미지 없으면 숨김
    }

    // PC와 모바일에 따라 다른 지도 이동 설정
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      // 모바일: 바텀시트 높이를 고려하여 보이는 영역의 중앙에 마커 배치
      const selectedInfoPanel = document.getElementById('selectedTyphoonInfo');
      const bottomSheetHeight =
        selectedInfoPanel && selectedInfoPanel.classList.contains('active')
          ? selectedInfoPanel.offsetHeight
          : 0;

      // 바텀시트 높이만큼 위로 offset (보이는 지도 영역의 중앙)
      const offsetY = bottomSheetHeight > 0 ? -(bottomSheetHeight / 4) : 0;

      map.flyTo({
        center: coordinates,
        zoom: 7,
        offset: [0, offsetY],
        duration: 1500,
      });

      // 모바일: 팝업을 마커 위치 기준으로 표시 (flyTo 완료 후)
      setTimeout(() => {
        const point = map.project(coordinates);
        const popupWidth = infoPanel.offsetWidth || 350;
        const popupHeight = infoPanel.offsetHeight || 200;

        // 마커를 중앙에 두고 팝업을 마커 중앙에 배치
        infoPanel.style.position = 'absolute';
        infoPanel.style.left = `${point.x - popupWidth / 2}px`;
        infoPanel.style.top = `${point.y - popupHeight / 2}px`; // 마커 중앙
        infoPanel.style.transform = 'none';
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

  // 마우스 호버 시 커서 변경
  map.on('mouseenter', `typhoon-points-${index}`, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', `typhoon-points-${index}`, () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * 태풍 경로 그리기 애니메이션
 * @param {number} routeIndex 애니메이션할 태풍의 인덱스
 */
function animateTyphoonRoute(routeIndex) {
  const typhoon = typhoons[routeIndex];
  const routeId = `typhoon-route-${routeIndex}`;
  const pointsId = `typhoon-points-${routeIndex}`;
  const routeSource = map.getSource(routeId);
  const pointsSource = map.getSource(pointsId);

  // 경로 좌표 추출 (객체 배열 또는 단순 배열 모두 처리)
  const fullPath = typhoon.path.map((p) => (Array.isArray(p) ? p : p.coord));

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

  const allPoints = fullPath.map((coord, pointIndex) => {
    const item = typhoon.path[pointIndex];
    return {
      type: 'Feature',
      properties: {
        name: typhoon.name,
        year: typhoon.year,
        index: routeIndex,
        pointIndex: pointIndex,
        isCurrent: false,
        isFirst: pointIndex === 0,
        ...(item.wind && { wind: item.wind }),
        ...(item.pressure && { pressure: item.pressure }),
        ...(item.windRadius && { windRadius: item.windRadius }),
        ...(item.time && { time: item.time }),
        ...(item.image && { image: item.image }),
      },
      geometry: {
        type: 'Point',
        coordinates: coord,
      },
    };
  });

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
 * "Top 5 태풍" 탭의 맵 초기화
 */
function initMapTop5(onLoadCallback) {
  // 모바일에서는 줌 레벨을 낮춰서 더 넓게 보이도록 설정
  const initialZoom = getResponsiveZoom(
    ZOOM_LEVELS.TOP5.desktop,
    ZOOM_LEVELS.TOP5.mobile
  );

  mapTop5 = new mapboxgl.Map({
    container: 'map-top5',
    style: createMapStyle(),
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
 * Top 5 태풍의 경로를 전용 맵에 렌더링
 * @param {Array<Object>} data 정렬 및 슬라이스된 Top 5 태풍 배열
 */
function renderTop5Map(data) {
  if (!mapTop5) return;

  // 1. 기존 레이어/소스 모두 정리
  // 이전 상태를 완전히 지우기 위해 충분히 반복 (예: 최대 10개)
  for (let i = 0; i < 10; i++) {
    const routeLayer = `top5-route-${i}`;
    const labelLayer = `top5-label-${i}`;
    const routeSource = `top5-route-${i}`;
    const labelSource = `top5-label-point-${i}`;

    if (mapTop5.getLayer(routeLayer)) mapTop5.removeLayer(routeLayer);
    if (mapTop5.getLayer(labelLayer)) mapTop5.removeLayer(labelLayer);

    if (mapTop5.getSource(routeSource)) mapTop5.removeSource(routeSource);
    if (mapTop5.getSource(labelSource)) mapTop5.removeSource(labelSource);
  }

  // 선 애니메이션 헬퍼 함수
  function animateLine(source, fullPath, duration, callback) {
    if (!source || !fullPath || fullPath.length === 0) return;

    // 좌표 배열인지 확인하고, 배열이 아니면 추출
    const coordinates = fullPath.map((p) => (Array.isArray(p) ? p : p.coord));

    let startTime = performance.now();
    function frame(timestamp) {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentPointIndex = Math.floor(progress * (coordinates.length - 1));
      const currentPath = coordinates.slice(0, currentPointIndex + 1);

      if (progress < 1 && currentPointIndex < coordinates.length - 1) {
        const segmentProgress =
          progress * (coordinates.length - 1) - currentPointIndex;
        const [lng1, lat1] = coordinates[currentPointIndex];
        const [lng2, lat2] = coordinates[currentPointIndex + 1];
        currentPath.push([
          lng1 + (lng2 - lng1) * segmentProgress,
          lat1 + (lat2 - lat1) * segmentProgress,
        ]);
      }

      // 데이터 설정 전 소스가 아직 존재하는지 확인 (사용자가 탭을 전환했을 수 있음)
      if (mapTop5.getSource(source.id)) {
        source.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: currentPath },
        });
      }

      if (progress < 1) requestAnimationFrame(frame);
      else {
        if (mapTop5.getSource(source.id)) {
          source.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coordinates },
          });
        }
        if (callback) callback();
      }
    }
    requestAnimationFrame(frame);
  }

  // 2. 새로운 Top 5 레이어 렌더링
  // 데이터가 더 많아도 최대 5개만 처리
  const top5Data = data.slice(0, 5);

  top5Data.forEach((typhoon, index) => {
    if (!typhoon || !typhoon.path || typhoon.path.length === 0) return;

    const color = TOP5_COLORS[index] || '#999999'; // Fallback color
    const routeSourceId = `top5-route-${index}`;
    const labelSourceId = `top5-label-point-${index}`;

    // 경로 좌표 추출
    const pathCoordinates = typhoon.path.map((p) =>
      Array.isArray(p) ? p : p.coord
    );

    // Add Route Source & Layer
    mapTop5.addSource(routeSourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] }, // Start empty for animation
      },
    });
    mapTop5.addLayer({
      id: `top5-route-${index}`,
      type: 'line',
      source: routeSourceId,
      paint: {
        'line-color': color,
        'line-width': 2.5,
        'line-opacity': 0.8,
      },
    });

    // Add Label Source & Layer
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
        'text-font': [
          'Spoqa Han Sans Neo',
          'Open Sans Bold',
          'Arial Unicode MS Bold',
        ],
        'text-size': 14,
        'text-radial-offset': 0,
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'viewport',
        'text-max-angle': 30, // 라벨이 더 잘 보이도록 각도 완화
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'symbol-spacing': 250,
        'text-keep-upright': false,
      },
      paint: {
        'text-color': color,
        'text-halo-color': '#000000',
        'text-halo-width': 2,
        'text-opacity': 0.9,
      },
    });

    // 레이어 순서 조정
    mapTop5.moveLayer(`top5-route-${index}`);
    mapTop5.moveLayer(`top5-label-${index}`);

    // 애니메이션 시작
    setTimeout(() => {
      const source = mapTop5.getSource(routeSourceId);
      if (source) {
        // Source object에 id 속성이 없으므로 직접 전달하거나 id를 통해 다시 조회해야 함
        // 하지만 여기서는 source 객체 자체를 넘기고, 내부에서 mapTop5.getSource(routeSourceId) 체크
        source.id = routeSourceId; // 편의상 id 주입

        animateLine(source, pathCoordinates, 1500, () => {
          const labelSource = mapTop5.getSource(labelSourceId);
          if (labelSource) {
            labelSource.setData({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: pathCoordinates },
              properties: {
                name: `${index + 1}위 ${typhoon.year}년 ${typhoon.name}`,
              },
            });
          }
        });
      }
    }, index * 200); // 순차적 애니메이션
  });
}

// ============================================ //
// 탭3: 영상 마커 맵
// ============================================ //

/**
 * "영상 아카이브" 탭의 맵 초기화
 */
function initMapVideos() {
  // 모바일에서는 줌 레벨을 낮춰서 더 넓게 보이도록 설정
  const initialZoom = getResponsiveZoom(
    ZOOM_LEVELS.VIDEOS.desktop,
    ZOOM_LEVELS.VIDEOS.mobile
  );

  mapVideos = new mapboxgl.Map({
    container: 'map-videos',
    style: createMapStyle(),
    center: [128.0, 36.0],
    zoom: initialZoom,
    pitch: 0,
  });

  mapVideos.on('load', async () => {
    await addBaseLayers(mapVideos);
    // 처음엔 마커를 렌더링하지 않음 - 태풍 선택을 기다림
  });

  // 지도 컨트롤 비활성화
  //mapVideos.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
}

/**
 * 영상 위치 마커를 GeoJSON 레이어를 사용하여 전용 맵에 렌더링
 * @param {'approaching' | 'damage'} type 표시할 영상 타입
 */
function renderVideoMarkers(type) {
  if (!mapVideos) return;

  // 기존 레이어와 소스 제거
  if (mapVideos.getLayer('video-markers')) {
    mapVideos.removeLayer('video-markers');
  }
  if (mapVideos.getLayer('video-markers-active')) {
    mapVideos.removeLayer('video-markers-active');
  }
  if (mapVideos.getLayer('video-markers-labels')) {
    mapVideos.removeLayer('video-markers-labels');
  }
  if (mapVideos.getSource('video-markers')) {
    mapVideos.removeSource('video-markers');
  }

  // 영상 타입 전환 시 활성 마커 상태 리셋
  activeVideoMarkerId = null;

  // 필터링된 비디오 데이터
  const filteredVideos = videoData.filter((m) => m.type === type);

  if (filteredVideos.length === 0) return;

  // GeoJSON 데이터 생성
  const markersData = {
    type: 'FeatureCollection',
    features: filteredVideos.map((video) => ({
      type: 'Feature',
      properties: {
        number: video.number, // Use original number from data
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
      'circle-radius': 16,
      'circle-color': type === 'approaching' ? '#E96B06' : '#DC1011',
      'circle-stroke-width': 0,
    },
  });

  // 활성 아웃라인 레이어 (처음엔 숨김)
  mapVideos.addLayer({
    id: 'video-markers-active',
    type: 'circle',
    source: 'video-markers',
    paint: {
      'circle-radius': 18,
      'circle-color': 'transparent',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#58FFDE',
      'circle-opacity': 0,
      'circle-stroke-opacity': 0,
    },
    filter: ['==', 'number', -1], // 처음엔 마커 안 보임
  });

  // 숫자 레이블 레이어 추가
  mapVideos.addLayer({
    id: 'video-markers-labels',
    type: 'symbol',
    source: 'video-markers',
    layout: {
      'text-field': ['get', 'number'],
      'text-font': [
        'Spoqa Han Sans Neo',
        'Lato',
        'Open Sans Bold',
        'Arial Unicode MS Bold',
      ],
      'text-size': 18,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#ffffff',
    },
  });

  // 마커를 다른 모든 레이어 위에 배치
  // moveLayer의 두 번째 인자가 없으면 맨 위로 이동
  mapVideos.moveLayer('video-markers');
  mapVideos.moveLayer('video-markers-active');
  mapVideos.moveLayer('video-markers-labels');

  // 클릭 이벤트 추가
  mapVideos.on('click', 'video-markers', (e) => {
    const properties = e.features[0].properties;
    const clickedNumber = properties.number;

    // 클릭한 마커만 표시하도록 활성 마커 필터 업데이트
    mapVideos.setFilter('video-markers-active', [
      '==',
      'number',
      clickedNumber,
    ]);
    mapVideos.setPaintProperty(
      'video-markers-active',
      'circle-stroke-opacity',
      0.9
    );
    activeVideoMarkerId = clickedNumber;

    // 커스텀 이벤트 생성 및 발송
    const event = new CustomEvent('markerClick', {
      detail: {
        slideIndex: properties.number - 1, // number는 1부터, 슬라이드 인덱스는 0부터
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
// 지도 컨트롤
// ============================================ //
// 지도 컨트롤 비활성화
//map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
//map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

// ============================================ //
// 팝업 닫기 이벤트
// ============================================ //
/**
 * 팝업 닫기 이벤트 설정
 */
function setupPopupCloseEvents() {
  const infoPanel = document.getElementById('typhoonInfoPanel');
  if (!infoPanel) return;

  // 팝업 닫기 및 활성 마커 상태 제거 헬퍼 함수
  const closePopupAndResetActive = () => {
    infoPanel.style.display = 'none';
    // 마커의 활성 상태 제거 (필터를 리셋하여 아무것도 안 보이게)
    if (activeMarkerId) {
      map.setFilter(`${activeMarkerId}-active`, ['==', 'pointIndex', -1]);
      activeMarkerId = null;
    }
  };

  // X 버튼 클릭으로 닫기
  const closeBtn = infoPanel.querySelector('.panel-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePopupAndResetActive);
  }

  // 지도의 빈 공간(마커가 아닌 곳) 클릭 시 팝업 닫기
  map.on('click', (e) => {
    // 마커를 클릭하지 않은 경우 (빈 지도를 클릭한 경우)
    const features = map.queryRenderedFeatures(e.point);
    const isMarkerClick = features.some((f) =>
      f.layer.id.includes('typhoon-points')
    );

    if (!isMarkerClick && infoPanel.style.display === 'block') {
      closePopupAndResetActive();
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
      closePopupAndResetActive();
    }
  });

  // 브라우저 리사이징 시 팝업 닫기
  window.addEventListener('resize', () => {
    if (infoPanel.style.display === 'block') {
      closePopupAndResetActive();
    }
  });
}
