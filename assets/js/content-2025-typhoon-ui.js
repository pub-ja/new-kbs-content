/**
 * @file UI component logic for the typhoon visualization page.
 * This includes tab navigation, custom selects, sliders, and other interactive elements.
 *
 * ============================================================
 * [개발 전달 가이드]
 * ============================================================
 *
 * 1. 파일 구조:
 *    - content-2025-typhoon-data.js: Mock 데이터 (API 연동 시 삭제)
 *    - content-2025-typhoon-map.js: 지도 로직
 *    - content-2025-typhoon-ui.js: UI 및 사용자 인터랙션 (현재 파일)
 *
 * 2. API 연동 시 수정 필요 부분:
 *    - renderTop5List(): Top5 리스트 렌더링
 *    - renderVideoSlider(): 비디오 슬라이더 렌더링
 *    - setupTyphoonSelect(): 태풍 선택 드롭다운
 *    - handleRankingTypeChange(): Top5 타입 변경
 *
 * 3. Mock 데이터 위치:
 *    - content-2025-typhoon-data.js 파일
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
// GLOBAL UI STATE
// ============================================================

let currentTab = 'tabTyphoon1';
let currentRankingType = null; // No default selection
let videoSwiper = null;

// Tracks which tabs have been visited to control overlay behavior
const tabVisited = {
  tabTyphoon1: true, // Start on the first tab
  tabTyphoon2: false,
  tabTyphoon3: false,
};

// Stores the open/closed state of map overlays
const overlayStates = {
  mapOverlay1: true,
  mapOverlay2: true,
  mapOverlay3: true,
};

// ============================================ //
// INITIALIZATION
// ============================================ //

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components for the default tab
  if (currentTyphoon) {
    renderCurrentTyphoon(currentTyphoon);
  }
  setupTyphoonSelect();

  // Initialize general UI handlers
  initializeTabNavigation();
  initializeMobileBottomSheetLayout();
  initializeMobileBottomSheetToggle();
  initMapOverlays();
  initializeTabStickyObserver();

  // 초기 맵 높이 설정 (약간의 지연 후)
  setTimeout(() => {
    updateMapHeight();
  }, 100);

  // Set up UI for other tabs, which will be fully initialized on first click
  setupCustomSelect('ranking-type-select', handleRankingTypeChange);
  // Do not initialize ranking type select with default selection
  setupCustomSelect('video-typhoon-select', (value) => {
    // A typhoon has been selected from the dropdown.
    // Make the video controls and slider visible (CSS 클래스로 통일)
    const videoControls = document.querySelector(
      '#tabTyphoon3 .video-controls'
    );
    if (videoControls) {
      videoControls.classList.add('active');
    }

    // Render map markers for the selected typhoon (default to 'approaching')
    if (typeof renderVideoMarkers === 'function') {
      renderVideoMarkers('approaching');
    }

    // Programmatically click the 'approaching' tab to trigger initial render
    const approachingTabButton = document.querySelector(
      '#tabTyphoon3 .cnt-panel-tab__button[data-video-type="approaching"]'
    );
    if (approachingTabButton) {
      approachingTabButton.click();
    }
  });
  initializeVideoTabButtons();

  // Set default text for video typhoon select trigger
  const videoSelectTrigger = document.querySelector(
    '#video-typhoon-select .cnt-custom-select__text'
  );
  if (videoSelectTrigger) {
    videoSelectTrigger.textContent = '태풍을 선택하세요.';
  }

  window.addEventListener('resize', () => {
    initializeMobileBottomSheetLayout();
    initializeMobileBottomSheetToggle();
    updateMapHeight();
  });

  // Add a listener for our custom event from the map
  window.addEventListener('markerClick', (e) => {
    if (videoSwiper && typeof videoSwiper.slideTo === 'function') {
      videoSwiper.slideTo(e.detail.slideIndex);
    }
  });
});

// ============================================ //
// TAB STICKY OBSERVER
// ============================================ //

/**
 * Global state: tracks whether tab navigation is currently in sticky mode
 */
let isStickyMode = false;

/**
 * Observes scroll position to determine sticky state and updates layout accordingly.
 * Focuses only on state monitoring and visual adjustments (content-full class).
 */
function initializeTabStickyObserver() {
  const tabNav = document.querySelector('.cnt-main-tab');
  if (!tabNav) return;

  const handleStickyState = () => {
    // Get computed top value from CSS (sticky position top value)
    const computedStyle = window.getComputedStyle(tabNav);
    const stickyTop = parseInt(computedStyle.top) || 0;

    // Check if element has reached its sticky position
    const rect = tabNav.getBoundingClientRect();
    const isSticky = rect.top <= stickyTop;
    const isMobile = window.innerWidth <= 900;

    // Update global sticky state
    isStickyMode = isSticky && isMobile;

    const activeContent = document.querySelector(
      '.cnt-main-tab__content.active'
    );
    if (!activeContent) return;

    // Visual state management: add/remove content-full class
    if (isSticky) {
      activeContent.classList.add('content-full');
    } else {
      activeContent.classList.remove('content-full');
    }

    // Panel state management: force expand when sticky, collapse when not
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

  // Initial check
  handleStickyState();

  // Update on scroll and resize
  window.addEventListener('scroll', () => {
    handleStickyState();
    updateMapHeight();
  });
  window.addEventListener('resize', handleStickyState);
}

/**
 * Initializes bottom sheet toggle and interaction handlers for mobile.
 * Centralized event management with state-aware behavior.
 */
function initializeMobileBottomSheetToggle() {
  const isMobile = window.innerWidth <= 900;

  document.querySelectorAll('.cnt-info-panel').forEach((panel) => {
    const panelTop = panel.querySelector('.cnt-panel-top');
    const handleWrapper = panel.querySelector('.cnt-panel-handle-wrapper');

    if (!isMobile) {
      // Desktop: ensure expanded class is removed
      panel.classList.remove('expanded');
      return;
    }

    // Mobile: ensure initial state is collapsed
    panel.classList.remove('expanded');

    // Mark that listeners have been initialized to prevent duplicates
    if (panel.dataset.listenersInitialized === 'true') {
      return;
    }
    panel.dataset.listenersInitialized = 'true';

    // 1. Panel top click handler (state-aware)
    if (panelTop) {
      panelTop.addEventListener('click', (e) => {
        // Ignore clicks on drag handle
        if (handleWrapper && handleWrapper.contains(e.target)) {
          return;
        }

        // Only toggle if NOT in sticky mode
        if (!isStickyMode) {
          const isExpanded = panel.classList.contains('expanded');
          if (isExpanded) {
            collapseBottomSheet(panel);
          } else {
            expandBottomSheet(panel);
          }
        }
        // In sticky mode, panel should always stay expanded (do nothing)
      });
    }

    // 2. Auto-expand on internal control clicks
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
      ); // Use capture phase to run before other handlers
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
      ); // Use capture phase to run before other handlers
    });
  });
}

// ============================================ //
// TAB 1: CURRENT VS. HISTORICAL
// ============================================ //

/**
 * Renders the info box for the current typhoon.
 * @param {Object} typhoon The current typhoon data object.
 */
function renderCurrentTyphoon(typhoon) {
  const container = document.getElementById('current-typhoon-section');
  if (!container) return;

  const typhoonItem = container.querySelector('.cnt-current-typhoon__item');
  const iconEl = container.querySelector('.cnt-current-typhoon__icon');
  const textEl = container.querySelector('.cnt-current-typhoon__text');

  if (!typhoon) {
    // No typhoon: remove active class and update content
    if (typhoonItem) typhoonItem.classList.remove('active');
    if (iconEl) iconEl.textContent = '';
    if (textEl) textEl.textContent = '발생 태풍 없음';
    return;
  }

  // Active typhoon: add active class and update content
  if (typhoonItem) typhoonItem.classList.add('active');
  if (iconEl) iconEl.textContent = '진행 중';
  if (textEl)
    textEl.textContent = `2025년 제 ${typhoon.number}호 ${typhoon.name}`;
}

/**
 * Sets up the event listeners for the historical typhoon dropdown select.
 */
function setupTyphoonSelect() {
  const infoContainer = document.getElementById('selected-typhoon-info');

  // This uses the shared setupCustomSelect function
  setupCustomSelect('typhoon-select', (selectedIndex) => {
    const typhoon = typhoons[selectedIndex];
    if (!typhoon) return;

    // Close the map popup when changing selection
    const infoPanel = document.getElementById('typhoon-info-panel');
    if (infoPanel) {
      infoPanel.style.display = 'none';
    }

    // Reset active marker state when changing selection
    if (
      typeof activeMarkerId !== 'undefined' &&
      activeMarkerId &&
      map.getLayer(`${activeMarkerId}-active`)
    ) {
      map.setFilter(`${activeMarkerId}-active`, ['==', 'pointIndex', -1]);
      activeMarkerId = null;
    }

    // Display info for the selected typhoon
    infoContainer.classList.add('active');
    const textParagraphs = infoContainer.querySelectorAll('.cnt-panel-text');

    if (textParagraphs.length >= 2) {
      // Update first paragraph
      textParagraphs[0].textContent =
        typhoon.description ||
        `${typhoon.year}년 태풍 ${typhoon.name}은 관측 이래 최대 규모의 태풍으로, 최저기압 ${typhoon.pressure}hPa와 초속 ${typhoon.wind}m/sec의 강풍 및 폭우로 한반도에 막대한 피해를 입혔습니다.`;

      // Update second paragraph
      const damageInTrillions = Math.floor(typhoon.damage / 10000);
      const damageInBillions = typhoon.damage % 10000;
      textParagraphs[1].textContent = `이 태풍은 ${typhoon.casualties.toLocaleString()}명의 인명피해와 ${damageInTrillions}조 ${damageInBillions}억 원의 재산피해를 가져왔으며, 당시 가장 큰 재난으로 남아있습니다.`;
    }

    // Calculate map bounds to fit both current and selected typhoons
    const bounds = new mapboxgl.LngLatBounds();
    typhoon.path.forEach((coord) => bounds.extend(coord));
    if (currentTyphoon) {
      currentTyphoon.path.forEach((p) => bounds.extend(p.coord));
    }

    // Hide all other historical paths and disable click events
    typhoons.forEach((_, i) => {
      if (map.getLayer(`typhoon-route-${i}`)) {
        map.setPaintProperty(`typhoon-route-${i}`, 'line-opacity', 0);
      }
      setMarkerOpacity(`typhoon-points-${i}`, 0);

      // Disable pointer events for all layers
      const layer = map.getLayer(`typhoon-points-${i}`);
      if (layer) {
        map.setLayoutProperty(`typhoon-points-${i}`, 'visibility', 'none');
      }
    });

    // Keep current typhoon visible but slightly faded
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

        // Animate the selected typhoon's path after the map moves
        setTimeout(() => {
          animateTyphoonRoute(parseInt(selectedIndex));
          // Enable click events only for the selected typhoon
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

    // Animate the selected typhoon's path after the map moves
    setTimeout(() => {
      animateTyphoonRoute(parseInt(selectedIndex));
      // Enable click events only for the selected typhoon
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

// ============================================ //
// TAB 2: TOP 5 TYPHOONS
// ============================================ //

/**
 * Handles the change event for the ranking type selector on Tab 2.
 * @param {'wind' | 'damage' | 'casualties'} type The selected ranking criterion.
 */
function handleRankingTypeChange(type) {
  currentRankingType = type;

  // Show the result panel when a selection is made (CSS 클래스로 통일)
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

  // Update both the map and the list
  renderTop5Map(data);
  renderTop5List(data);
}

/**
 * Renders the list of top 5 typhoons in the info panel.
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
 * @param {Array<Object>} data The sorted and sliced array of top 5 typhoons.
 */
function renderTop5List(data) {
  const listContainer = document.getElementById('topTyphoonList');
  if (!listContainer) return;

  // [MOCK DATA - API 연동 시 이 함수 전체를 API 호출로 교체]
  listContainer.innerHTML = ''; // Clear the list before rendering

  data.forEach((typhoon) => {
    let value, unit;

    if (currentRankingType === 'wind') {
      value = typhoon.wind.toFixed(1);
      unit = 'm/s';
    } else if (currentRankingType === 'damage') {
      // Value is expected to be in 100 million Won units.
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

// ============================================ //
// TAB 3: TYPHOON VIDEOS
// ============================================ //

/**
 * Sets up event listeners for the video type tabs (approaching/damage).
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
 * Renders the Swiper.js slider for typhoon videos.
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
 * @param {'approaching' | 'damage'} type The type of videos to display.
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
                <img src="${video.thumbnail || './assets/images/temp/img-video-slider-thumb.jpg'}" alt="${video.title}" onerror="this.src='./assets/images/temp/img-video-slider-thumb.jpg'">
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
      nextEl: '.cnt-swiper__button next',
      prevEl: '.cnt-swiper__button prev',
    },
    pagination: {
      el: '.cnt-swiper__pagination',
      clickable: true,
    },
  });
  videoSwiper.update();
}

// ============================================ //
// GENERAL UI & NAVIGATION
// ============================================ //

/**
 * Initializes the main tab navigation.
 */
function initializeTabNavigation() {
  document.querySelectorAll('.cnt-main-tab__button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });
}

/**
 * Switches the view to the selected tab.
 * @param {string} tabId The ID of the tab to switch to.
 */
function switchTab(tabId) {
  if (currentTab === tabId) return;
  currentTab = tabId;

  // Update button and content visibility
  document.querySelectorAll('.cnt-main-tab__button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.cnt-main-tab__content').forEach((content) => {
    content.classList.toggle('active', content.id === tabId);
  });

  // Transfer content-full class to new active tab if in sticky mode
  const tabNav = document.querySelector('.cnt-main-tab');
  if (tabNav) {
    const isSticky = tabNav.getBoundingClientRect().top <= 0;

    // Remove content-full from all tabs
    document.querySelectorAll('.cnt-main-tab__content').forEach((content) => {
      content.classList.remove('content-full');
    });

    // Add content-full to new active tab if sticky
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

  // Expand overlay on first visit
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

  // Initialize map if it doesn't exist yet
  if (tabId === 'tabTyphoon2') {
    // Remove active class if no selection (CSS 클래스로 통일)
    const resultPanel = document.querySelector(
      '#tabTyphoon2 .cnt-panel-result'
    );
    if (resultPanel && !currentRankingType) {
      resultPanel.classList.remove('active');
    }

    if (!mapTop5) {
      initMapTop5(() => {
        // Only render data if a ranking type has been selected
        if (currentRankingType) {
          setTimeout(() => {
            handleRankingTypeChange(currentRankingType);
          }, 100);
        }
      });
    } else if (currentRankingType) {
      // Only render data if a ranking type has been selected
      handleRankingTypeChange(currentRankingType);
    }
  } else if (tabId === 'tabTyphoon3' && !mapVideos) initMapVideos();

  // Resize map to fit new container dimensions
  setTimeout(() => {
    updateMapHeight();
    if (tabId === 'tabTyphoon1' && map) map.resize();
    else if (tabId === 'tabTyphoon2' && mapTop5) mapTop5.resize();
    else if (tabId === 'tabTyphoon3' && mapVideos) mapVideos.resize();
  }, 100);
}

/**
 * Sets up a generic custom select dropdown.
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
 * @param {string} selectId The ID of the select element.
 * @param {Function} onSelectCallback A callback function executed on selection.
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
    const dropdownHeight = 280; // from CSS
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

      // Remove selected class from all options
      options.forEach((opt) => opt.classList.remove('selected'));
      // Add selected class to clicked option
      option.classList.add('selected');

      // Add selected class to trigger
      selectTrigger.classList.add('selected');

      // For the first tab's select, we keep the color indicator
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
 * Initializes the toggle functionality for map overlays.
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
 * Collapses all map overlays, e.g., after a user action.
 */
function collapseOverlaysOnAction() {
  document.querySelectorAll('.cnt-map-overlay').forEach((overlay) => {
    overlay.classList.add('collapsed');
    overlayStates[overlay.id] = false;
  });
}

/**
 * Resizes the current active map instance based on the current tab.
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
 * Updates map section height based on bottom sheet height.
 * Optimized with requestAnimationFrame for smooth transitions.
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
 * Expands the bottom sheet to full height with optimized timing.
 * Coordinates CSS transitions with map height updates for smooth visuals.
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
 * Collapses the bottom sheet to show only panel-top with optimized timing.
 */
function collapseBottomSheet(panel) {
  panel.classList.remove('expanded');

  // CSS transition duration (300ms) 후 맵 높이 업데이트
  setTimeout(() => {
    updateMapHeight();
  }, 310);
}

/**
 * Initializes the draggable bottom sheet layout for mobile viewports.
 */
function initializeMobileBottomSheetLayout() {
  if (window.innerWidth > 900) {
    document.querySelectorAll('.cnt-info-panel').forEach((panel) => {
      panel.style.height = ''; // Restore original height
      panel.style.maxHeight = ''; // Clear maxHeight
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
