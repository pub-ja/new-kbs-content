/**
 * @file Mock data for typhoon visualization
 *
 * ============================================================
 * [개발 전달 가이드 - 중요!]
 * ============================================================
 *
 * 이 파일은 퍼블리싱 테스트용 Mock 데이터입니다.
 * API 연동 시 이 파일 전체를 삭제하거나 주석 처리하세요.
 *
 * API 연동 방법:
 * 1. 이 파일 삭제 또는 주석 처리
 * 2. content-2025-typhoon-ui.js에서 API 호출 추가
 * 3. 데이터 구조는 아래 형식 참고하여 유지 권장
 */

// ============================================================
// 태풍 색상 상수
// ============================================================
// [개발 참고] 태풍별 고유 색상 - UI와 일관성 유지 필요

const TYPHOON_COLORS = {
  SARAH: '#ffa07a', // 사라 - 주황
  PRAPIROON: '#4ecdc4', // 뿌라삐롱 - 청록
  RUSA: '#ff6b6b', // 루사 - 빨강
  MAEMI: '#74b9ff', // 매미 - 파랑
  NARI: '#ff9cee', // 나리 - 분홍
  BOLAVEN: '#95e1d3', // 볼라벤&덴빈 - 민트
  CHABA: '#ffd93d', // 차바 - 노랑
};

// ============================================================
// 현재 진행중인 태풍
// ============================================================
/**
 * [MOCK DATA] 현재 진행중인 태풍 데이터
 *
 * API 응답 형식:
 * {
 *   name: string,           // 태풍명
 *   number: string,         // 태풍 번호
 *   year: number,           // 발생년도
 *   path: [                 // 이동 경로
 *     {
 *       coord: [lng, lat],  // 좌표 [경도, 위도]
 *       time: string,       // 시간 (예: "20일(화) 06시")
 *       wind: number,       // 풍속 (m/s)
 *       windRadius15: number, // 15m/s 강풍 반경 (km)
 *       windRadius25: number, // 25m/s 강풍 반경 (km)
 *       isPast: boolean,    // 과거 위치 여부
 *       isCurrent?: boolean // 현재 위치 여부 (선택)
 *     }
 *   ],
 *   currentPosition: number, // 현재 위치 인덱스
 *   pressure: number,       // 중심기압 (hPa)
 *   damage: number,         // 재산피해 (억원)
 *   casualties: number,     // 인명피해 (명)
 *   category: string        // 등급 ("강", "매우강", "초강력")
 * }
 *
 * [중요] 현재 진행중인 태풍이 없을 경우 null 반환
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
  currentPosition: 2,
  damage: 0,
  rain: 0,
  wind: 22,
  casualties: 0,
  pressure: 965,
  windRadius: 280,
  windRadius25: 180,
  color: 'red',
  category: '강',
  isCurrent: true,
};
// const currentTyphoon = null; // 현재 태풍 없을 시 이렇게 설정

// ============================================================
// 역대 태풍 데이터
// ============================================================
/**
 * [MOCK DATA] 역대 태풍 데이터 배열
 * HTML 셀렉트 박스 순서와 동일하게 정렬
 *
 * API 응답 형식:
 * [
 *   {
 *     name: string,          // 태풍명 (한글)
 *     nameEn: string,        // 태풍명 (영문)
 *     number: string,        // 태풍 번호
 *     year: number,          // 발생년도
 *     path: [[lng, lat]],    // 이동 경로 좌표 배열
 *     damage: number,        // 재산피해 (억원)
 *     rain: number,          // 강수량 (mm)
 *     wind: number,          // 최대풍속 (m/s)
 *     casualties: number,    // 인명피해 (명)
 *     pressure: number,      // 중심기압 (hPa)
 *     windRadius: number,    // 강풍 반경 (km)
 *     color: string,         // 색상 (hex)
 *     category: string,      // 등급 ("강", "매우강", "초강력")
 *     description?: string   // 설명 (선택)
 *   }
 * ]
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

// ============================================================
// Top 5 관련 데이터
// ============================================================
/**
 * [개발 참고] 순위별 색상
 * 1위: #F65570, 2위: #DA9EFF, 3위: #E2B35D, 4위: #52D03E, 5위: #87E5FF
 */
const top5Colors = ['#F65570', '#DA9EFF', '#E2B35D', '#52D03E', '#87E5FF'];

/**
 * [MOCK DATA] Top5 데이터
 * 현재는 클라이언트에서 정렬하지만, API에서 정렬된 Top5 데이터를 받는 것을 권장
 *
 * 권장 API 엔드포인트:
 * GET /api/typhoons/top5?type=damage
 * GET /api/typhoons/top5?type=casualties
 * GET /api/typhoons/top5?type=wind
 */
const top5DamageData = [...typhoons]
  .sort((a, b) => b.damage - a.damage)
  .slice(0, 5)
  .map((t, i) => ({ ...t, rank: i + 1 }));

const top5CasualtiesData = [...typhoons]
  .sort((a, b) => b.casualties - a.casualties)
  .slice(0, 5)
  .map((t, i) => ({ ...t, rank: i + 1 }));

// ============================================================
// 영상 데이터
// ============================================================
/**
 * [MOCK DATA] 태풍 영상 마커 데이터
 *
 * API 응답 형식:
 * [
 *   {
 *     coord: [lng, lat],    // 지도 좌표 [경도, 위도]
 *     number: number,       // 영상 번호
 *     type: string,         // 영상 타입: "approaching" | "damage"
 *     title: string,        // 영상 제목
 *     date: string,         // 날짜 (YYYY.MM.DD)
 *     thumbnail: string,    // 썸네일 이미지 URL
 *     url: string           // 영상 URL (실제 영상 페이지 링크)
 *   }
 * ]
 */
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
    number: 1,
    type: 'damage',
    title: '[서울] 침수 피해 현장',
    date: '2012.08.28',
    thumbnail: './assets/images/video/thumb4.jpg',
    url: '#',
  },
  {
    coord: [129.5, 36.0],
    number: 2,
    type: 'damage',
    title: '[강릉] 태풍 루사 피해',
    date: '2002.09.01',
    thumbnail: './assets/images/temp/img-video-slider-thumb.jpg',
    url: '#',
  },
  {
    coord: [128.0, 35.5],
    number: 3,
    type: 'damage',
    title: '[부산] 태풍 매미 피해',
    date: '2003.09.13',
    thumbnail: './assets/images/temp/img-video-slider-thumb.jpg',
    url: '#',
  },
  {
    coord: [126.5, 33.5],
    number: 4,
    type: 'damage',
    title: '[제주] 침수 피해',
    date: '2016.10.06',
    thumbnail: './assets/images/temp/img-video-slider-thumb.jpg',
    url: '#',
  },
];
