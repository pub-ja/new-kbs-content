# 지도로 되짚어보는 역대 한반도 태풍

역대 한반도에 영향을 준 태풍들을 인터랙티브 지도로 비교하고 분석하는 웹 애플리케이션입니다.

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [개발 가이드](#개발-가이드)
- [API 연동 가이드](#api-연동-가이드)
- [프로덕션 배포](#프로덕션-배포)

## 프로젝트 개요

이 프로젝트는 현재 태풍과 과거 태풍을 비교하고, 역대 최강 태풍 순위를 확인하며, 태풍 관련 역사 영상을 지도상에서 탐색할 수 있는 인터랙티브 시각화 도구입니다.

### 주요 기능

#### 1. 현재 vs 과거 태풍 비교 (탭 1)

- **현재 태풍 시각화**:
  - 과거 경로(실선)와 예측 경로(점선) 자동 구분
  - 태풍의 눈 아이콘 회전 애니메이션 (Mapbox 네이티브 구현)
  - 강풍 반경(15m/s, 25m/s) 동적 시각화
- 과거 태풍 경로와 동시 비교 가능
- 마커 클릭 시 지점별 상세 데이터 팝업 표시

#### 2. 역대 Top 5 태풍 (탭 2)

- 최대풍속, 재산피해, 인명피해 기준으로 순위 확인
- 순위별 태풍 경로 시각화 (색상별 구분)
- 경로 라인 애니메이션 효과

#### 3. 역사 영상 아카이브 (탭 3)

- 태풍 접근 및 피해 기록 영상을 지도상 위치와 함께 제공
- 영상 슬라이더(Swiper)로 손쉬운 탐색
- 접근 기록 / 피해 기록 타입별 필터링

## 기술 스택

### 프론트엔드

- **HTML5** - 시맨틱 마크업
- **CSS3** - BEM 방법론, CSS Variables, Flexbox, Grid
- **Vanilla JavaScript (ES6+)** - 모듈화된 구조

### 라이브러리

- **Mapbox GL JS v3.0.1** - 인터랙티브 3D 지도
- **Swiper.js v12.0.3** - 터치 지원 캐러셀 슬라이더
- **[Spoqa Han Sans Neo](https://spoqa.github.io/spoqa-han-sans/)** - 한글 최적화 웹폰트

## 프로젝트 구조

```
kbs-content-2025/
├── index.html                          # 메인 HTML 파일
├── package.json                        # NPM 설정 파일
├── README.md                           # 프로젝트 문서
├── assets/
│   ├── js/
│   │   ├── content-typhoon-data.js     # [중요] Mock 데이터 (API 구조 참조용)
│   │   ├── content-typhoon-map.js      # 지도 초기화 및 태풍 시각화 로직
│   │   ├── content-typhoon-ui.js       # UI 인터랙션 및 컴포넌트 제어
│   │   └── swiper-bundle.min.js        # Swiper 라이브러리
│   ├── css/
│   │   ├── style.css                   # 메인 스타일시트 (BEM 방법론)
│   │   └── fonts.css                   # 웹폰트 정의
│   └── images/
│       └── typhoon/                    # 태풍 아이콘 리소스 (SVG)
```

## 설치 및 실행

이 프로젝트는 CORS 문제 없이 로컬 파일(`file://`)로도 실행 가능하도록 아이콘 로딩 방식이 처리되어 있습니다.

1. `index.html` 파일을 브라우저(Chrome 권장)로 엽니다.

## 개발 가이드

### 주요 JavaScript 모듈

#### 1. content-typhoon-data.js

**역할**: 개발용 Mock 데이터 제공 및 API 구조 가이드

**주요 데이터**:

- `currentTyphoon`: 현재 태풍 데이터 (경로, 풍속, 기압, 강풍 반경 등)
- `typhoons[]`: 역대 7개 주요 태풍 데이터
  - Sarah (1959), Rusa (2002), Maemi (2003) 등
- `top5DamageData` 등: Top 5 순위 데이터
- `videoData[]`: 영상 메타데이터

**중요**: 역대 태풍 API 개발 시, 아래 '사라' 태풍의 데이터 구조를 표준 형식으로 참조하시기 바랍니다.

**데이터 구조 예시 (API 설계 시 참조 - 역대 태풍 '사라' 기준)**:

```javascript
{
  name: '사라',
  nameEn: 'SARAH',
  number: '14',
  year: 1959,
  // 경로 데이터는 '객체 배열' 형태를 권장 (지점별 팝업 정보 표시용)
  path: [
    {
      coord: [123.0, 27.0],        // 좌표 [경도, 위도]
      time: '1959-09-16 00:00',    // 관측 시간
      wind: 45,                    // 풍속 (m/s)
      pressure: 985,               // 중심기압 (hPa)
      windRadius: 150,             // 강풍 반경 (km)
      image: './path/to/img.gif'   // 해당 지점 이미지 (없으면 안나옴)
    },
    {
      coord: [124.5, 29.5],
      time: '1959-09-16 06:00',
      wind: 55,
      pressure: 975,
      // ...
    }
    // ... 계속
  ],
  damage: 850,                     // 총 재산피해 (억원)
  casualties: 849,                 // 총 인명피해 (명)
  wind: 85,                        // 최대 풍속 (m/s)
  pressure: 950,                   // 최저 기압 (hPa)
  color: '#ffa07a',                // 경로 표시 색상 (Hex)
  category: '초강력',               // 등급
  description: '1959년 태풍 사라는...' // 설명 텍스트
}
```

#### 2. content-typhoon-map.js

**역할**: Mapbox GL 지도 초기화 및 시각화 로직

**주요 함수**:

- `initializeMap()`: 메인 지도 초기화
- `addCurrentTyphoonToMap(typhoon)`: 현재 태풍 렌더링 (핵심 로직)
  - **회전 애니메이션**: `icon-rotate` 속성을 사용한 네이티브 애니메이션 구현
  - **경로 스타일**: `isPast` 속성에 따라 실선/점선 자동 분기
- `addTyphoonToMap(typhoon, index, isVisible)`: 역대 태풍 경로 추가
- `renderTop5Map(data)`: Top 5 경로 애니메이션
- `renderVideoMarkers(type)`: 영상 마커 표시

**⚠️ 현재 태풍 시각화 스타일 확인 필요**:

현재 태풍의 시각화 디자인은 기존 현황판의 Mapbox 스타일과 다를 수 있습니다.
기존 현황판에서 사용 중인 Mapbox 스타일을 적용하려면 아래 위치의 코드를 수정해야 합니다:

1. **현재 태풍 아이콘 및 색상** ([content-typhoon-map.js:361-559](assets/js/content-typhoon-map.js#L361-L559))
   - 태풍의 눈 아이콘: Line 505 (`'icon-image': 'typhoon-strong'`)
   - 과거 경로 색상: Line 383 (`'line-color': '#353578'`)
   - 예상 경로 색상: Line 405 (`'line-color': '#FF4444'`)
   - 강풍 반경 색상: Line 434, 460 (`circle-color`)

2. **Mapbox Studio 스타일 사용 시** ([content-typhoon-map.js:90-142](assets/js/content-typhoon-map.js#L90-L142))
   - 기존 현황판에서 Mapbox Studio로 관리하는 스타일이 있다면, Line 145의 `style` 속성을 Studio URL로 교체 가능
   - 예: `style: 'mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID'`

#### 3. content-typhoon-ui.js

**역할**: UI 인터랙션 및 컴포넌트 제어

**주요 기능**:

- 탭 전환 (`initializeTabNavigation`)
- 커스텀 셀렉트 박스 (`setupCustomSelect`)
- 모바일 하단 시트 드래그 (`initializeMobileBottomSheetLayout`)

---

## API 연동 가이드

### 준비 사항

1. **Mock 데이터 제거**

   ```html
   <!-- index.html에서 아래 스크립트 태그 삭제 -->
   <script src="./assets/js/content-typhoon-data.js"></script>
   ```

2. **API 엔드포인트 설계 (예시)**

   백엔드 개발 시 아래와 같은 엔드포인트 구조를 권장합니다.
   - `GET /api/typhoons/current` - 현재 태풍 정보 (리턴: `currentTyphoon` 객체)
   - `GET /api/typhoons/historical` - 역대 태풍 목록 (리턴: `typhoons` 배열)
   - `GET /api/typhoons/top5?type={wind|damage|casualties}` - Top 5 순위 데이터
   - `GET /api/videos?type={approaching|damage}` - 영상 메타데이터

3. **API 호출 함수 추가 (content-typhoon-ui.js)**

   ```javascript
   // 예시: 현재 태풍 데이터 가져오기
   async function fetchCurrentTyphoon() {
     try {
       const response = await fetch('/api/typhoons/current');
       if (!response.ok) throw new Error('Failed to fetch current typhoon');
       const data = await response.json();
       return data;
     } catch (error) {
       console.error('Error fetching current typhoon:', error);
       return null;
     }
   }

   // 예시: 역대 태풍 목록 가져오기
   async function fetchHistoricalTyphoons() {
     try {
       const response = await fetch('/api/typhoons/historical');
       if (!response.ok) throw new Error('Failed to fetch typhoons');
       const data = await response.json();
       return data;
     } catch (error) {
       console.error('Error fetching typhoons:', error);
       return [];
     }
   }
   ```

4. **초기화 로직 수정 (content-typhoon-ui.js)**

   ```javascript
   // 기존 Mock 데이터 참조를 API 호출로 대체하는 방법
   document.addEventListener('DOMContentLoaded', async () => {
     // API에서 데이터 가져오기
     const [currentTyphoonData, typhoonsData, videoData] = await Promise.all([
       fetchCurrentTyphoon(),
       fetchHistoricalTyphoons(),
       fetchVideoData(), // 별도 구현 필요
     ]);

     // 전역 변수에 할당하여 기존 로직 활용
     window.currentTyphoon = currentTyphoonData;
     window.typhoons = typhoonsData;
     window.videoData = videoData;

     // 기존 초기화 로직 실행
     initializeTabNavigation();
     setupTyphoonSelect();
     // ...
   });
   ```

---

## 프로덕션 배포

### 배포 전 체크리스트

- [ ] **Mapbox Access Token 교체**
  - `content-typhoon-map.js` 상단의 토큰을 운영용 토큰으로 반드시 교체하세요.
- [ ] **환경 변수로 Access Token 관리** (권장)

  ```javascript
  mapboxgl.accessToken = process.env.MAPBOX_TOKEN || 'your-production-token';
  ```

- [ ] **외부 리소스 URL 업데이트**
  - 영상 URL, 이미지 썸네일 경로 등을 실제 운영 서버 경로로 변경해야 합니다.

- [ ] **Console 로그 제거**
  - 개발 중 사용된 `console.log`를 제거하고, 필요한 에러 로깅(`console.error`)만 남겨두세요.

- [ ] **임시 개발 파일 정리**
  - `assets/images/temp/` - 개발용 샘플 이미지 (퍼블리싱 작업 시 필요, 프로덕션 배포 전 확인)
  - `assets/js/temp/` - 개발용 테스트 파일 (퍼블리싱 작업 시 필요, 프로덕션 배포 전 확인)
