/**
 * @file 태풍 시각화 페이지의 UI 컴포넌트 로직
 * 탭 네비게이션, 커스텀 셀렉트, 슬라이더 및 기타 인터랙티브 요소 포함
 *
 *
 * 1. 파일 구조:
 *    - content-typhoon-data.js: Mock 데이터 (API 연동 시 삭제)
 *    - content-typhoon-map.js: 지도 로직
 *    - content-typhoon-ui.js: UI 및 사용자 인터랙션 (현재 파일)
 *
 * 2. API 연동 시 수정 필요 부분:
 *    - renderTop5List(): Top5 리스트 렌더링
 *    - renderVideoSlider(): 비디오 슬라이더 렌더링
 *    - setupTyphoonSelect(): 태풍 선택 드롭다운
 *    - handleRankingTypeChange(): Top5 타입 변경
 *
 * 3. Mock 데이터 위치:
 *    - content-typhoon-data.js 파일
 *    - 변수: currentTyphoon, typhoons, videoData, top5DamageData, top5CasualtiesData
 *
 * 4. 주요 데이터 구조:
 *    - Top5: { rank, year, name, wind/damage/casualties, color }
 *    - Video: { coord, number, type, title, date, thumbnail, url }
 *
 * 5. 유지해야 할 기능:
 *    - Swiper.js 초기화 및 제어
 *    - 모바일 바텀시트 드래그/토글
 *    - 탭 전환 및 스티키 네비게이션
 *    - 지도 마커 클릭 ↔ 슬라이더 동기화
 */

// ============================================================
// 전역 UI 상태
// ============================================================

let currentTab = 'tabTyphoon1';
let currentRankingType = null; // 기본 선택 없음
let videoSwiper = null;

// 오버레이 동작을 제어하기 위해 방문한 탭을 추적
const tabVisited = {
  tabTyphoon1: true, // 첫 번째 탭에서 시작
  tabTyphoon2: false,
  tabTyphoon3: false,
};

// 지도 오버레이의 열림/닫힘 상태 저장
const overlayStates = {
  mapOverlay1: true,
  mapOverlay2: true,
  mapOverlay3: true,
};

// ============================================================
// 초기화
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 기본 탭의 UI 컴포넌트 초기화
  if (currentTyphoon) {
    renderCurrentTyphoon(currentTyphoon);
  }
  setupTyphoonSelect();

  // 일반 UI 핸들러 초기화
  initializeTabNavigation();
  initializeMobileBottomSheetLayout();
  initializeMobileBottomSheetToggle();
  initMapOverlays();
  initializeTabStickyObserver();

  // 초기 맵 높이 설정 (약간의 지연 후)
  setTimeout(() => {
    updateMapHeight();
  }, 100);

  // 다른 탭의 UI 설정 (첫 클릭 시 완전히 초기화됨)
  setupCustomSelect('rankingTypeSelect', handleRankingTypeChange);
  // 순위 타입 선택에 기본값 설정하지 않음
  setupCustomSelect('videoTyphoonSelect', (value) => {
    // 드롭다운에서 태풍이 선택됨
    // 비디오 컨트롤과 슬라이더를 표시 (CSS 클래스로 통일)
    const videoControls = document.querySelector(
      '#tabTyphoon3 .video-controls'
    );
    if (videoControls) {
      videoControls.classList.add('active');
    }

    // 선택된 태풍의 지도 마커 렌더링 (기본값: 'approaching')
    if (typeof renderVideoMarkers === 'function') {
      renderVideoMarkers('approaching');
    }

    // 초기 렌더링을 위해 프로그래밍 방식으로 'approaching' 탭 클릭
    const approachingTabButton = document.querySelector(
      '#tabTyphoon3 .cnt-panel-tab__button[data-video-type="approaching"]'
    );
    if (approachingTabButton) {
      approachingTabButton.click();
    }
  });
  initializeVideoTabButtons();

  // 비디오 태풍 선택의 기본 텍스트 설정
  const videoSelectTrigger = document.querySelector(
    '#videoTyphoonSelect .cnt-custom-select__text'
  );
  if (videoSelectTrigger) {
    videoSelectTrigger.textContent = '태풍을 선택하세요.';
  }

  window.addEventListener('resize', () => {
    initializeMobileBottomSheetLayout();
    initializeMobileBottomSheetToggle();
    updateMapHeight();
  });

  // 지도에서 발생하는 커스텀 이벤트 리스너 추가
  window.addEventListener('markerClick', (e) => {
    if (videoSwiper && typeof videoSwiper.slideTo === 'function') {
      videoSwiper.slideTo(e.detail.slideIndex);
    }
  });
});

// ============================================================
// 탭 스티키 옵저버
// ============================================================

/**
 * 전역 상태: 탭 네비게이션이 현재 스티키 모드인지 추적
 */
let isStickyMode = false;

/**
 * 스크롤 위치를 감시하여 스티키 상태를 확인하고 그에 따라 레이아웃을 업데이트합니다.
 * 상태 모니터링 및 시각적 조정(content-full 클래스)에만 집중합니다.
 */
function initializeTabStickyObserver() {
  const tabNav = document.querySelector('.cnt-main-tab');
  if (!tabNav) return;

  const handleStickyState = () => {
    // CSS에서 계산된 top 값 가져오기 (sticky position top value)
    const computedStyle = window.getComputedStyle(tabNav);
    const stickyTop = parseInt(computedStyle.top) || 0;

    // 요소가 스티키 위치에 도달했는지 확인
    const rect = tabNav.getBoundingClientRect();
    const isSticky = rect.top <= stickyTop;
    const isMobile = window.innerWidth <= 900;

    // 전역 스티키 상태 업데이트
    isStickyMode = isSticky && isMobile;

    const activeContent = document.querySelector(
      '.cnt-main-tab__content.active'
    );
    if (!activeContent) return;

    // 시각적 상태 관리: content-full 클래스 추가/제거
    if (isSticky) {
      activeContent.classList.add('content-full');
    } else {
      activeContent.classList.remove('content-full');
    }

    // 패널 상태 관리: 스티키일 때 강제 확장, 아닐 때 축소
    if (isMobile) {
      const panel = activeContent.querySelector('.cnt-info-panel');
      if (!panel) return;

      if (isSticky && !panel.classList.contains('expanded')) {
        expandBottomSheet(panel);
      } else if (!isSticky && panel.classList.contains('expanded')) {
        collapseBottomSheet(panel);
      }
    }
  };

  // 초기 확인
  handleStickyState();

  // 스크롤 및 리사이즈 시 업데이트
  window.addEventListener('scroll', () => {
    handleStickyState();
    updateMapHeight();
  });
  window.addEventListener('resize', handleStickyState);
}

/**
 * 모바일용 바텀시트 토글 및 인터랙션 핸들러를 초기화합니다.
 * 상태 인식 동작을 가진 중앙 집중식 이벤트 관리입니다.
 */
function initializeMobileBottomSheetToggle() {
  const isMobile = window.innerWidth <= 900;

  document.querySelectorAll('.cnt-info-panel').forEach((panel) => {
    const panelTop = panel.querySelector('.cnt-panel-top');
    const handleWrapper = panel.querySelector('.cnt-panel-handle-wrapper');

    if (!isMobile) {
      // 데스크톱: expanded 클래스가 제거되었는지 확인
      panel.classList.remove('expanded');
      return;
    }

    // 모바일: 초기 상태는 축소됨
    panel.classList.remove('expanded');

    // 리스너가 이미 초기화되었는지 표시하여 중복 방지
    if (panel.dataset.listenersInitialized === 'true') {
      return;
    }
    panel.dataset.listenersInitialized = 'true';

    // 1. 패널 상단 클릭 핸들러 (상태 인식)
    if (panelTop) {
      panelTop.addEventListener('click', (e) => {
        // 드래그 핸들 클릭 무시
        if (handleWrapper && handleWrapper.contains(e.target)) {
          return;
        }

        // 스티키 모드가 아닐 때만 토글
        if (!isStickyMode) {
          const isExpanded = panel.classList.contains('expanded');
          if (isExpanded) {
            collapseBottomSheet(panel);
          } else {
            expandBottomSheet(panel);
          }
        }
        // 스티키 모드에서는 패널이 항상 확장 상태 유지 (아무것도 안 함)
      });
    }

    // 2. 내부 컨트롤 클릭 시 자동 확장
    const customSelects = panel.querySelectorAll('.cnt-custom-select__trigger');
    customSelects.forEach((trigger) => {
      trigger.addEventListener(
        'click',
        (e) => {
          if (!panel.classList.contains('expanded')) {
            expandBottomSheet(panel);
          }
        },
        { capture: true }
      ); // 캡처 단계 사용하여 다른 핸들러보다 먼저 실행
    });

    const panelTabButtons = panel.querySelectorAll('.cnt-panel-tab__button');
    panelTabButtons.forEach((btn) => {
      btn.addEventListener(
        'click',
        (e) => {
          if (!panel.classList.contains('expanded')) {
            expandBottomSheet(panel);
          }
        },
        { capture: true }
      ); // 캡처 단계 사용하여 다른 핸들러보다 먼저 실행
    });
  });
}

// ============================================================
// 탭 1: 현재 태풍 vs 역대 태풍
// ============================================================

/**
 * 현재 태풍의 정보 박스를 렌더링합니다.
 * @param {Object} typhoon 현재 태풍 데이터 객체
 */
function renderCurrentTyphoon(typhoon) {
  const container = document.getElementById('current-typhoon-section');
  if (!container) return;

  const typhoonItem = container.querySelector('.cnt-current-typhoon__item');
  const iconEl = container.querySelector('.cnt-current-typhoon__icon');
  const textEl = container.querySelector('.cnt-current-typhoon__text');

  if (!typhoon) {
    // 태풍 없음: active 클래스 제거 및 내용 업데이트
    if (typhoonItem) typhoonItem.classList.remove('active');
    if (iconEl) iconEl.textContent = '';
    if (textEl) textEl.textContent = '발생 태풍 없음';
    return;
  }

  // 활성 태풍: active 클래스 추가 및 내용 업데이트
  if (typhoonItem) typhoonItem.classList.add('active');
  if (iconEl) iconEl.textContent = '진행 중';
  if (textEl)
    textEl.textContent = `2025년 제 ${typhoon.number}호 ${typhoon.name}`;
}

/**
 * 역대 태풍 드롭다운 선택의 이벤트 리스너를 설정합니다.
 */
function setupTyphoonSelect() {
  const infoContainer = document.getElementById('selectedTyphoonInfo');

  // 공유 setupCustomSelect 함수 사용
  setupCustomSelect('typhoon-select', (selectedIndex) => {
    // 데이터 사용 가능 여부 확인
    if (typeof typhoons === 'undefined' || !Array.isArray(typhoons)) {
      console.error('Typhoons data not available');
      return;
    }
    if (selectedIndex < 0 || selectedIndex >= typhoons.length) {
      console.error('Invalid typhoon selection index:', selectedIndex);
      return;
    }

    const typhoon = typhoons[selectedIndex];
    if (!typhoon) return;

    // 선택 변경 시 지도 팝업 닫기
    const infoPanel = document.getElementById('typhoonInfoPanel');
    if (infoPanel) {
      infoPanel.style.display = 'none';
    }

    // 선택 변경 시 활성 마커 상태 초기화
    if (
      typeof activeMarkerId !== 'undefined' &&
      activeMarkerId &&
      map.getLayer(`${activeMarkerId}-active`)
    ) {
      map.setFilter(`${activeMarkerId}-active`, ['==', 'pointIndex', -1]);
      activeMarkerId = null;
    }

    // 선택된 태풍의 정보 표시
    infoContainer.classList.add('active');
    const textParagraphs = infoContainer.querySelectorAll('.cnt-panel-text');

    if (textParagraphs.length >= 1) {
      // 데이터에서 설명을 가져와 단락 업데이트
      textParagraphs[0].textContent = typhoon.description || '';
    }

    // 현재 태풍과 선택된 태풍이 모두 보이도록 지도 범위 계산
    const bounds = new mapboxgl.LngLatBounds();
    if (typhoon.path && Array.isArray(typhoon.path)) {
      typhoon.path.forEach((coord) => bounds.extend(coord));
    }
    if (
      currentTyphoon &&
      currentTyphoon.path &&
      Array.isArray(currentTyphoon.path)
    ) {
      currentTyphoon.path.forEach((p) => bounds.extend(p.coord));
    }

    // 다른 모든 역대 태풍 경로 숨기고 클릭 이벤트 비활성화
    typhoons.forEach((_, i) => {
      if (map.getLayer(`typhoon-route-${i}`)) {
        map.setPaintProperty(`typhoon-route-${i}`, 'line-opacity', 0);
      }
      setMarkerOpacity(`typhoon-points-${i}`, 0);

      // 모든 레이어의 포인터 이벤트 비활성화
      const layer = map.getLayer(`typhoon-points-${i}`);
      if (layer) {
        map.setLayoutProperty(`typhoon-points-${i}`, 'visibility', 'none');
      }
    });

    // 현재 태풍은 표시하되 약간 흐리게 유지
    if (currentTyphoon && map.getLayer('typhoon-route-current-past')) {
      map.setPaintProperty('typhoon-route-current-past', 'line-opacity', 0.6);
    }
    if (currentTyphoon) {
      setMarkerOpacity('typhoon-points-current', 0.6);
    }

    // 모바일과 PC에서 다른 padding 적용
    const isMobile = window.innerWidth <= 900;

    // 모바일에서는 바텀시트 높이를 고려하여 padding 계산
    let bottomPadding = 50;
    if (isMobile && infoContainer) {
      // infoContainer가 active 상태가 되면 높이를 측정
      // DOM 업데이트 후 높이를 측정하기 위해 다음 프레임에서 실행
      setTimeout(() => {
        const containerHeight = infoContainer.offsetHeight;
        bottomPadding = containerHeight + 20; // 여유 공간 20px 추가

        map.fitBounds(bounds, {
          padding: { top: 50, bottom: bottomPadding, left: 50, right: 50 },
          duration: 1500,
          maxZoom: 8,
        });

        // 지도 이동 후 선택된 태풍의 경로 애니메이션
        setTimeout(() => {
          animateTyphoonRoute(parseInt(selectedIndex));
          // 선택된 태풍에만 클릭 이벤트 활성화
          const selectedLayer = map.getLayer(`typhoon-points-${selectedIndex}`);
          if (selectedLayer) {
            map.setLayoutProperty(
              `typhoon-points-${selectedIndex}`,
              'visibility',
              'visible'
            );
          }
        }, 1500);
      }, 100);
      return; // 모바일에서는 여기서 종료
    }

    // PC에서의 처리
    const padding = { top: 80, bottom: 80, left: 80, right: 400 };

    map.fitBounds(bounds, {
      padding: padding,
      duration: 1500,
      maxZoom: 8,
    });

    // 지도 이동 후 선택된 태풍의 경로 애니메이션
    setTimeout(() => {
      animateTyphoonRoute(parseInt(selectedIndex));
      // 선택된 태풍에만 클릭 이벤트 활성화
      const selectedLayer = map.getLayer(`typhoon-points-${selectedIndex}`);
      if (selectedLayer) {
        map.setLayoutProperty(
          `typhoon-points-${selectedIndex}`,
          'visibility',
          'visible'
        );
      }
    }, 1500);
  });
}

// ============================================================
// 탭 2: TOP 5 태풍
// ============================================================

/**
 * 탭 2의 순위 타입 선택기 변경 이벤트를 처리합니다.
 * @param {'wind' | 'damage' | 'casualties'} type 선택된 순위 기준
 */
function handleRankingTypeChange(type) {
  currentRankingType = type;

  // 선택이 이루어지면 결과 패널 표시 (CSS 클래스로 통일)
  const resultPanel = document.querySelector('#tabTyphoon2 .cnt-panel-result');
  if (resultPanel) {
    resultPanel.classList.add('active');
  }

  const titleMap = {
    wind: '최대 순간 풍속',
    damage: '재산 피해액',
    casualties: '최대 인명 피해',
  };
  const resultTitle = document.querySelector(
    '#tabTyphoon2 .cnt-panel-result__title'
  );
  if (resultTitle) {
    resultTitle.textContent = titleMap[type];
  }

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

  // 지도와 리스트 모두 업데이트
  renderTop5Map(data);
  renderTop5List(data);
}

/**
 * 정보 패널에 Top 5 태풍 리스트를 렌더링합니다.
 *
 * [API 연동 가이드]
 * - 현재: Mock 데이터(typhoons 배열)를 정렬하여 렌더링
 * - 개발 시: API 응답 데이터로 교체
 *
 * API 응답 예상 형식:
 * [
 *   {
 *     rank: 1,              // 순위
 *     year: 2002,           // 년도
 *     name: "루사",         // 태풍명
 *     wind: 56.0,           // 최대풍속 (m/s)
 *     damage: 51000,        // 재산피해 (억원)
 *     casualties: 246       // 인명피해 (명)
 *   },
 *   ...
 * ]
 *
 * @param {Array<Object>} data 정렬되고 슬라이스된 Top 5 태풍 배열
 */
function renderTop5List(data) {
  const listContainer = document.getElementById('topTyphoonList');
  if (!listContainer) return;

  // [MOCK DATA - API 연동 시 이 함수 전체를 API 호출로 교체]
  listContainer.innerHTML = ''; // 렌더링 전 리스트 초기화

  data.forEach((typhoon) => {
    let value, unit;

    if (currentRankingType === 'wind') {
      value = typhoon.wind.toFixed(1);
      unit = 'm/s';
    } else if (currentRankingType === 'damage') {
      // 값은 억원 단위로 제공됨
      value = typhoon.damage.toLocaleString();
      unit = '억원';
    } else if (currentRankingType === 'casualties') {
      value = typhoon.casualties.toLocaleString();
      unit = '명';
    }

    // [개발 참고] 아래 HTML 구조를 React 컴포넌트 또는 템플릿 엔진으로 변환
    const listItemHTML = `
      <li class="cnt-top5-list__item">
        <div class="cnt-top5-list__info">
          <span class="cnt-top5-list__rank rank${typhoon.rank}">${typhoon.rank}위</span>
          <span class="cnt-top5-list__year">${typhoon.year}년</span>
          <span class="cnt-top5-list__name">${typhoon.name}</span>
        </div>
        <div class="cnt-top5-list__value">
          ${value} <span class="cnt-top5-list__unit">${unit}</span>
        </div>
      </li>
    `;
    listContainer.innerHTML += listItemHTML;
  });
}

// ============================================================
// 탭 3: 태풍 영상
// ============================================================

/**
 * 영상 타입 탭(접근/피해)의 이벤트 리스너를 설정합니다.
 */
function initializeVideoTabButtons() {
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
}

/**
 * 태풍 영상을 위한 Swiper.js 슬라이더를 렌더링합니다.
 *
 * ============================================================
 * [Mapbox Studio / API 연동 가이드]
 * ============================================================
 *
 * 📌 필수 필드 (Required Fields)
 * - type: string - "approaching" | "damage" (정확한 값 필수, 대소문자 구분)
 * - number: number - 각 타입별로 1부터 시작하는 순번 (마커-슬라이더 연동에 사용)
 * - title: string - 영상 제목
 * - date: string - 날짜 (형식: "YYYY.MM.DD")
 * - url: string - 영상 링크 URL
 * - coord: [number, number] - 지도 좌표 [경도, 위도] (마커 표시 위치)
 *
 * 📌 선택 필드 (Optional Fields)
 * - thumbnail: string - 썸네일 이미지 URL (없으면 기본 이미지 사용)
 *
 * ============================================================
 * [중요] 데이터 매핑 규칙
 * ============================================================
 *
 * 1. type 값 매핑:
 *    - "approaching" → 접근 기록 탭 / 마커 색상: #E96B06
 *    - "damage" → 피해 기록 탭 / 마커 색상: #DC1011
 *    - CSS: .swiper-slide[data-type="..."] .cnt-video-slide__number
 *
 * 2. number 매핑 (중요!):
 *    - 각 type별로 1부터 시작 (approaching: 1,2,3 / damage: 1,2,3)
 *    - 마커 클릭 시 slideIndex 계산에 사용: properties.number - 1
 *    - 연속된 번호여야 슬라이더와 정확히 매칭됨
 *
 * 3. coord 매핑:
 *    - GeoJSON 형식: [경도(lng), 위도(lat)]
 *    - 예: [129.0, 35.1]
 *
 * ============================================================
 * API 응답 예시:
 * ============================================================
 * [
 *   {
 *     coord: [129.0, 35.1],
 *     number: 1,
 *     type: "approaching",
 *     title: "[강릉] 영동지역의 폭우",
 *     date: "2002.08.31",
 *     thumbnail: "./assets/images/video/thumb1.jpg",
 *     url: "https://..."
 *   },
 *   {
 *     coord: [126.5, 33.5],
 *     number: 2,
 *     type: "approaching",
 *     ...
 *   },
 *   {
 *     coord: [127.0, 37.5],
 *     number: 1,
 *     type: "damage",
 *     ...
 *   }
 * ]
 *
 * @param {'approaching' | 'damage'} type 표시할 영상 타입
 */
function renderVideoSlider(type) {
  const sliderWrapper = document.querySelector(
    '.cnt-video-slider .swiper-wrapper'
  );
  if (!sliderWrapper) return;

  // [MOCK DATA - API 연동 시 videoData를 API 응답으로 교체]
  const filteredVideos = videoData.filter((video) => video.type === type);

  // 슬라이드 동적 생성
  sliderWrapper.innerHTML = filteredVideos
    .map(
      (video) => `
        <div class="swiper-slide" data-type="${video.type}">
          <div class="cnt-video-slider__item">
            <a href="${video.url}" class="cnt-video-slide__link" target="_blank">
              <div class="cnt-video-slide__thumbnail">
                <img src="${video.thumbnail || './assets/images/img-empty-thumb.jpg'}" alt="${video.title}" onerror="this.src='./assets/images/img-empty-thumb.jpg'">
              </div>
              <div class="cnt-video-slide__content">
                <div class="cnt-video-slide__info">
                  <div class="cnt-video-slide__title-wrapper">
                    <span class="cnt-video-slide__number">${video.number}</span>
                    <div class="cnt-video-slide__title">${video.title}</div>
                  </div>
                  <div class="cnt-video-slide__date">${video.date}</div>
                </div>
                <div class="cnt-video-slide__icon">
                  <img src="./assets/images/icon-new-blank.svg" alt="외부 링크" width="30" height="30">
                </div>
              </div>
            </a>
          </div>
        </div>
    `
    )
    .join('');

  // Swiper 재초기화
  if (videoSwiper) {
    videoSwiper.destroy(true, true);
  }

  videoSwiper = new Swiper('.cnt-video-slider', {
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: {
      nextEl: '.cnt-swiper__button.next',
      prevEl: '.cnt-swiper__button.prev',
      disabledClass: 'swiper-button-disabled',
    },
    pagination: {
      el: '.cnt-swiper__pagination',
      clickable: true,
    },
    on: {
      init: function () {
        // 초기화 후 navigation 업데이트
        this.navigation.update();
      },
    },
  });
}

// ============================================================
// 일반 UI 및 네비게이션
// ============================================================

/**
 * 메인 탭 네비게이션을 초기화합니다.
 */
function initializeTabNavigation() {
  document.querySelectorAll('.cnt-main-tab__button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });
}

/**
 * 선택한 탭으로 뷰를 전환합니다.
 * @param {string} tabId 전환할 탭의 ID
 */
function switchTab(tabId) {
  if (currentTab === tabId) return;
  currentTab = tabId;

  // 버튼 및 컨텐츠 표시 상태 업데이트
  document.querySelectorAll('.cnt-main-tab__button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.cnt-main-tab__content').forEach((content) => {
    content.classList.toggle('active', content.id === tabId);
  });

  // 스티키 모드인 경우 새 활성 탭으로 content-full 클래스 이전
  const tabNav = document.querySelector('.cnt-main-tab');
  if (tabNav) {
    const isSticky = tabNav.getBoundingClientRect().top <= 0;

    // 모든 탭에서 content-full 제거
    document.querySelectorAll('.cnt-main-tab__content').forEach((content) => {
      content.classList.remove('content-full');
    });

    // 스티키 상태면 새 활성 탭에 content-full 추가
    if (isSticky) {
      const activeContent = document.querySelector(
        '.cnt-main-tab__content.active'
      );
      if (activeContent) {
        activeContent.classList.add('content-full');
      }
    }
  }

  // 모바일에서 탭 클릭 시 스티키 상태 + 바텀시트 확장
  if (window.innerWidth <= 900) {
    const tabNav = document.querySelector('.cnt-main-tab');
    if (tabNav) {
      setTimeout(() => {
        tabNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    // 바텀시트도 확장
    const activeContent = document.querySelector(
      '.cnt-main-tab__content.active'
    );
    if (activeContent) {
      const panel = activeContent.querySelector('.cnt-info-panel');
      if (panel && !panel.classList.contains('expanded')) {
        expandBottomSheet(panel);
      }
    }
  }

  // 첫 방문 시 오버레이 확장
  setTimeout(() => {
    if (!tabVisited[tabId]) {
      tabVisited[tabId] = true;
      const overlayId = `mapOverlay${tabId.slice(-1)}`;
      const overlay = document.getElementById(overlayId);
      if (overlay) {
        overlay.classList.remove('collapsed');
        overlayStates[overlayId] = true;
      }
    }
  }, 0);

  // 지도가 아직 없으면 초기화
  if (tabId === 'tabTyphoon2') {
    // 선택이 없으면 active 클래스 제거 (CSS 클래스로 통일)
    const resultPanel = document.querySelector(
      '#tabTyphoon2 .cnt-panel-result'
    );
    if (resultPanel && !currentRankingType) {
      resultPanel.classList.remove('active');
    }

    if (!mapTop5) {
      initMapTop5(() => {
        // 순위 타입이 선택된 경우에만 데이터 렌더링
        if (currentRankingType) {
          setTimeout(() => {
            handleRankingTypeChange(currentRankingType);
          }, 100);
        }
      });
    } else if (currentRankingType) {
      // 순위 타입이 선택된 경우에만 데이터 렌더링
      handleRankingTypeChange(currentRankingType);
    }
  } else if (tabId === 'tabTyphoon3' && !mapVideos) initMapVideos();

  // 새 컨테이너 크기에 맞게 지도 리사이즈
  setTimeout(() => {
    updateMapHeight();
    if (tabId === 'tabTyphoon1' && map) map.resize();
    else if (tabId === 'tabTyphoon2' && mapTop5) mapTop5.resize();
    else if (tabId === 'tabTyphoon3' && mapVideos) mapVideos.resize();
  }, 100);
}

/**
 * 범용 커스텀 셀렉트 드롭다운을 설정합니다.
 *
 * [개발 권장사항]
 * - 드롭다운 옵션은 HTML에서 직접 관리하는 것을 권장
 * - 현재 구조: HTML에 .cnt-custom-select__option 요소를 미리 작성
 * - data-value 속성으로 값 전달, .cnt-custom-select__option-text로 텍스트 표시
 *
 * HTML 구조 예시:
 * <div id="custom-select" class="cnt-custom-select">
 *   <div class="cnt-custom-select__trigger">
 *     <span class="cnt-custom-select__text">선택하세요</span>
 *   </div>
 *   <ul class="cnt-custom-select__options">
 *     <li class="cnt-custom-select__option" data-value="0">
 *       <span class="cnt-custom-select__option-text">옵션 1</span>
 *     </li>
 *   </ul>
 * </div>
 *
 * [API 연동 시]
 * - 옵션을 동적으로 생성해야 한다면 innerHTML로 옵션 리스트 생성
 * - 또는 React의 경우 컴포넌트로 변환하여 map() 사용
 *
 * @param {string} selectId 셀렉트 요소의 ID
 * @param {Function} onSelectCallback 선택 시 실행될 콜백 함수
 */
function setupCustomSelect(selectId, onSelectCallback) {
  const customSelect = document.getElementById(selectId);
  if (!customSelect) return;

  const selectTrigger = customSelect.querySelector(
    '.cnt-custom-select__trigger'
  );
  const options = customSelect.querySelectorAll('.cnt-custom-select__option');

  function calculateDropdownPosition() {
    const rect = customSelect.getBoundingClientRect();
    const dropdownHeight = 280; // CSS에서 가져옴
    if (
      window.innerHeight - rect.bottom < dropdownHeight &&
      rect.top > dropdownHeight
    ) {
      customSelect.classList.add('open-upward');
    } else {
      customSelect.classList.remove('open-upward');
    }
  }

  selectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.cnt-custom-select.open').forEach((sel) => {
      if (sel !== customSelect) sel.classList.remove('open', 'open-upward');
    });
    calculateDropdownPosition();
    customSelect.classList.toggle('open');
  });

  options.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.getAttribute('data-value');
      const text = option.querySelector(
        '.cnt-custom-select__option-text'
      ).textContent;

      // 모든 옵션에서 selected 클래스 제거
      options.forEach((opt) => opt.classList.remove('selected'));
      // 클릭한 옵션에 selected 클래스 추가
      option.classList.add('selected');

      // 트리거에 selected 클래스 추가
      selectTrigger.classList.add('selected');

      // 첫 번째 탭의 셀렉트는 색상 표시기 유지
      if (selectId === 'typhoon-select') {
        const colorIndicator = option.querySelector(
          '.cnt-color-indicator'
        ).outerHTML;
        selectTrigger.querySelector('.cnt-custom-select__text').innerHTML =
          `${colorIndicator}${text}`;
      } else {
        selectTrigger.querySelector('.cnt-custom-select__text').textContent =
          text;
      }

      customSelect.classList.remove('open', 'open-upward');
      collapseOverlaysOnAction();
      if (onSelectCallback) onSelectCallback(value);
    });
  });

  document.addEventListener('click', () =>
    customSelect.classList.remove('open', 'open-upward')
  );
}

/**
 * 지도 오버레이의 토글 기능을 초기화합니다.
 */
function initMapOverlays() {
  document.querySelectorAll('.cnt-map-overlay__toggle').forEach((toggleBtn) => {
    const overlay = toggleBtn.closest('.cnt-map-overlay');
    if (!overlay) return;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = overlay.classList.toggle('collapsed');
      overlayStates[overlay.id] = !isCollapsed;
    });
  });

  document.addEventListener('click', (e) => {
    document
      .querySelectorAll('.cnt-map-overlay:not(.collapsed)')
      .forEach((overlay) => {
        if (!overlay.closest('.cnt-map-title-wrap').contains(e.target)) {
          overlay.classList.add('collapsed');
          overlayStates[overlay.id] = false;
        }
      });
  });
}

/**
 * 모든 지도 오버레이를 축소합니다 (예: 사용자 액션 후).
 */
function collapseOverlaysOnAction() {
  document.querySelectorAll('.cnt-map-overlay').forEach((overlay) => {
    overlay.classList.add('collapsed');
    overlayStates[overlay.id] = false;
  });
}

/**
 * 현재 탭을 기준으로 활성 지도 인스턴스를 리사이즈합니다.
 */
function resizeCurrentMap() {
  if (currentTab === 'tabTyphoon1' && typeof map !== 'undefined' && map) {
    map.resize();
  } else if (
    currentTab === 'tabTyphoon2' &&
    typeof mapTop5 !== 'undefined' &&
    mapTop5
  ) {
    mapTop5.resize();
  } else if (
    currentTab === 'tabTyphoon3' &&
    typeof mapVideos !== 'undefined' &&
    mapVideos
  ) {
    mapVideos.resize();
  }
}

/**
 * 바텀시트 높이를 기준으로 지도 섹션 높이를 업데이트합니다.
 * requestAnimationFrame으로 최적화하여 부드러운 전환을 제공합니다.
 */
function updateMapHeight() {
  if (window.innerWidth > 900) {
    // 데스크톱에서는 CSS 기본값 사용
    document.querySelectorAll('.cnt-map-section').forEach((section) => {
      section.style.height = '';
      section.style.maxHeight = '';
    });
    return;
  }

  const activeTab = document.querySelector('.cnt-main-tab__content.active');
  if (!activeTab) return;

  const panel = activeTab.querySelector('.cnt-info-panel');
  const mapSection = activeTab.querySelector('.cnt-map-section');

  if (!panel || !mapSection) {
    console.warn('updateMapHeight: panel or mapSection not found');
    return;
  }

  // requestAnimationFrame으로 다음 프레임에 실행하여 높이 계산이 완료된 후 실행
  requestAnimationFrame(() => {
    const panelHeight = panel.offsetHeight || panel.clientHeight;
    const viewportHeight = window.innerHeight;

    // 맵 섹션의 실제 화면상 위치를 기준으로 계산
    const mapSectionTop = mapSection.getBoundingClientRect().top;
    const availableHeight = viewportHeight - mapSectionTop;

    const mapHeight = Math.max(100, availableHeight - panelHeight); // 최소 100px 보장

    mapSection.style.height = `${mapHeight}px`;
    mapSection.style.maxHeight = `${mapHeight}px`;
    mapSection.style.minHeight = `${mapHeight}px`;

    // 맵 인스턴스도 리사이즈 (약간의 지연 후)
    setTimeout(() => {
      resizeCurrentMap();
    }, 10);
  });
}

/**
 * 바텀시트를 전체 높이로 확장합니다. 최적화된 타이밍 적용.
 * CSS 전환과 지도 높이 업데이트를 조율하여 부드러운 시각 효과를 제공합니다.
 */
function expandBottomSheet(panel) {
  panel.classList.add('expanded');

  // 탭을 sticky 상태로 만들기 위해 스크롤을 최상단으로 이동
  const visualSection = document.querySelector('.cnt-visual');
  if (visualSection) {
    // visual 영역이 있으면 visual 아래(탭 위치)로 스크롤
    const tabNav = document.querySelector('.cnt-main-tab');
    if (tabNav) {
      tabNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // CSS transition duration (300ms) 후 맵 높이 업데이트
  // 추가로 10ms 버퍼를 둬서 CSS transition이 완전히 끝난 후 실행
  setTimeout(() => {
    updateMapHeight();
  }, 310);
}

/**
 * 바텀시트를 축소하여 panel-top만 표시합니다.
 */
function collapseBottomSheet(panel) {
  panel.classList.remove('expanded');

  // CSS transition duration (300ms) 후 맵 높이 업데이트
  setTimeout(() => {
    updateMapHeight();
  }, 310);
}

/**
 * 모바일 뷰포트용 드래그 가능한 바텀시트 레이아웃을 초기화합니다.
 */
function initializeMobileBottomSheetLayout() {
  if (window.innerWidth > 900) {
    document.querySelectorAll('.cnt-info-panel').forEach((panel) => {
      panel.style.height = ''; // 원래 높이 복원
      panel.style.maxHeight = ''; // maxHeight 초기화
    });
    return;
  }

  document.querySelectorAll('.cnt-info-panel').forEach((panel) => {
    const handleWrapper = panel.querySelector('.cnt-panel-handle-wrapper');
    if (!handleWrapper) return;

    let initialY, initialHeight;
    const onDragStart = (e) => {
      e.preventDefault();
      // 드래그 시작 시 확장 상태로 전환
      if (!panel.classList.contains('expanded')) {
        expandBottomSheet(panel);
        return; // 첫 드래그는 확장만 하고 종료
      }

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

      const minHeight = 70; // collapsed 높이
      const maxHeight = window.innerHeight * 0.6;
      const calculatedHeight = Math.max(
        minHeight,
        Math.min(newHeight, maxHeight)
      );

      panel.style.maxHeight = `${calculatedHeight}px`;

      // 바텀시트 높이에 따라 맵 높이 조정
      const activeTab = document.querySelector('.cnt-main-tab__content.active');
      const mapSection = activeTab?.querySelector('.cnt-map-section');

      if (mapSection && panel) {
        const panelHeight = panel.offsetHeight || panel.clientHeight;
        const viewportHeight = window.innerHeight;
        const tabHeight = 52;
        const availableHeight = viewportHeight - tabHeight;
        const mapHeight = Math.max(100, availableHeight - panelHeight);

        mapSection.style.height = `${mapHeight}px`;
        mapSection.style.maxHeight = `${mapHeight}px`;
        mapSection.style.minHeight = `${mapHeight}px`;

        // 드래그 중 맵 스케일 즉시 조정
        resizeCurrentMap();
      }
    };

    const onDragEnd = () => {
      panel.style.transition = 'max-height 0.3s ease';
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchend', onDragEnd);

      // 드래그 종료 시 맵 높이 최종 조정
      setTimeout(() => {
        updateMapHeight();
      }, 50);
    };

    handleWrapper.addEventListener('mousedown', onDragStart);
    handleWrapper.addEventListener('touchstart', onDragStart, {
      passive: false,
    });
  });
}
