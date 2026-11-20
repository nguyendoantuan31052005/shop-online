(() => {
  const hero = document.querySelector('.hero-main');
  if (!hero) return;

  const vietnamDate = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(new Date()).map(part => [part.type, Number(part.value)]));
  const { month, day } = vietnamDate;
  let lunarMonth = 0;
  let lunarDay = 0;
  try {
    const lunarParts = new Intl.DateTimeFormat('en-u-ca-chinese', {
      timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric', day: 'numeric'
    }).formatToParts(new Date());
    const lunar = Object.fromEntries(lunarParts.map(part => [part.type, part.value]));
    lunarMonth = Number.parseInt(lunar.month, 10) || 0;
    lunarDay = Number.parseInt(lunar.day, 10) || 0;
  } catch { /* The Gregorian seasonal calendar remains available in older browsers. */ }

  let season = 'everyday';
  let title = 'Nhịp sống an yên';
  let symbol = '✦';
  if ((month === 11) || (month === 12 && day <= 27)) {
    season = 'christmas'; title = 'Mùa lễ hội'; symbol = '✧';
  } else if ((month === 12 && day >= 28) || (month === 1 && day <= 4)) {
    season = 'new-year'; title = 'Năm mới, nhà mới'; symbol = '✧';
  } else if (lunarMonth === 1 && lunarDay >= 1 && lunarDay <= 8) {
    season = 'tet'; title = 'Tết sum vầy'; symbol = '✿';
  } else if (lunarMonth === 8 && lunarDay >= 12 && lunarDay <= 17) {
    season = 'mid-autumn'; title = 'Trăng rằm đoàn viên'; symbol = '☾';
  } else if (month === 2 && day >= 7 && day <= 14) {
    season = 'valentine'; title = 'Ngày yêu thương'; symbol = '♡';
  } else if (month === 3 && day >= 1 && day <= 8) {
    season = 'women'; title = 'Tháng của yêu thương'; symbol = '✿';
  } else if (month === 10 && day >= 20 && day <= 31) {
    season = 'halloween'; title = 'Mùa sắc màu'; symbol = '✧';
  } else if (month >= 3 && month <= 5) {
    season = 'spring'; title = 'Nhà đón mùa xuân'; symbol = '✿';
  } else if (month >= 6 && month <= 8) {
    season = 'summer'; title = 'Mùa hè trong nhà'; symbol = '☆';
  } else if (month >= 9 && month <= 10) {
    season = 'autumn'; title = 'Mùa thu dịu dàng'; symbol = '✦';
  }

  document.documentElement.dataset.season = season;
  hero.classList.add('has-seasonal-experience');

  const badge = document.createElement('div');
  badge.className = 'seasonal-badge';
  badge.setAttribute('aria-label', title);
  badge.innerHTML = `<span class="seasonal-badge-symbol" aria-hidden="true">${symbol}</span><span class="seasonal-title">${title}</span><span class="weather-summary" role="status" aria-live="polite" hidden><span class="weather-glyph" aria-hidden="true"></span><span class="weather-text"></span><small class="weather-updated"></small></span><a class="weather-attribution" href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer" hidden>WeatherAPI</a><button class="weather-action" type="button" aria-label="Bật thời tiết theo vị trí" title="Chỉ lấy vị trí khi bạn bấm">Thời tiết</button><button class="weather-disable" type="button" aria-label="Tắt thời tiết và xóa vị trí đã lưu" title="Tắt thời tiết" hidden>×</button>`;
  const atmosphere = document.createElement('div');
  atmosphere.className = 'seasonal-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  hero.prepend(atmosphere, badge);

  if (season === 'christmas' || season === 'new-year' || season === 'tet') {
    const garland = document.createElement('div');
    garland.className = `seasonal-garland seasonal-garland--${season}`;
    garland.setAttribute('aria-hidden', 'true');
    garland.innerHTML = '<i></i>'.repeat(13);
    hero.prepend(garland);
  }

  const weatherButton = badge.querySelector('.weather-action');
  const weatherDisable = badge.querySelector('.weather-disable');
  const weatherSummary = badge.querySelector('.weather-summary');
  const weatherGlyph = badge.querySelector('.weather-glyph');
  const weatherText = badge.querySelector('.weather-text');
  const weatherUpdated = badge.querySelector('.weather-updated');
  const weatherCredit = badge.querySelector('.weather-attribution');
  const weatherPreferenceKey = 'home-shopping-weather-location-v1';
  let weatherScene = null;

  function updateWeatherScene(kind) {
    document.documentElement.dataset.weather = kind;
    if (!weatherScene) {
      weatherScene = document.createElement('div');
      weatherScene.className = 'weather-scene';
      weatherScene.setAttribute('aria-hidden', 'true');
      document.body.prepend(weatherScene);
    }
    weatherScene.className = `weather-scene weather-scene--${kind}`;
    weatherScene.replaceChildren();
    const particleCount = kind === 'rain' || kind === 'storm' ? 34 : kind === 'snow' ? 24 : 0;
    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement('i');
      particle.className = `weather-particle weather-particle--${kind}`;
      particle.style.setProperty('--weather-x', `${Math.random() * 100}vw`);
      particle.style.setProperty('--weather-top', `${Math.random() * 100}vh`);
      particle.style.setProperty('--weather-duration', `${kind === 'snow' ? 9 + Math.random() * 9 : 1.8 + Math.random() * 1.8}s`);
      particle.style.setProperty('--weather-delay', `${-Math.random() * 15}s`);
      particle.style.setProperty('--weather-size', `${2 + Math.random() * 5}px`);
      weatherScene.append(particle);
    }
    if (kind === 'cloudy' || kind === 'fog' || kind === 'storm') {
      for (let index = 0; index < (kind === 'storm' ? 2 : 3); index += 1) {
        const cloud = document.createElement('i');
        cloud.className = `weather-cloud weather-cloud--${index + 1}`;
        weatherScene.append(cloud);
      }
    }
  }

  function weatherGlyphFor(kind) {
    return ({ sunny: '☀', 'clear-night': '☾', cloudy: '⛅', rain: '☔', snow: '❄', storm: '⛈' })[kind] || '☁';
  }

  function showWeather(data) {
    updateWeatherScene(data.kind || 'cloudy');
    weatherGlyph.textContent = weatherGlyphFor(data.kind);
    const place = [data.location, data.country].filter(Boolean).join(', ');
    weatherText.textContent = `${Math.round(data.temperatureC)}°C · ${data.condition}${place ? ` · ${place}` : ''}`;
    const updatedTime = String(data.updatedAt || '').match(/\d{2}:\d{2}$/)?.[0] || '';
    weatherUpdated.textContent = updatedTime ? `Cập nhật ${updatedTime}` : '';
    weatherUpdated.hidden = !updatedTime;
    weatherSummary.hidden = false;
    weatherCredit.hidden = false;
    weatherButton.hidden = false;
    weatherDisable.hidden = false;
    weatherButton.textContent = 'Làm mới';
    weatherButton.disabled = false;
  }

  function showWeatherMessage(message) {
    weatherSummary.hidden = false;
    weatherGlyph.textContent = '☁';
    weatherText.textContent = message;
    weatherButton.hidden = false;
    weatherButton.disabled = false;
  }

  async function loadWeather(latitude, longitude) {
    weatherButton.disabled = true;
    weatherButton.textContent = 'Đang tải';
    const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
    const response = await fetch(`/api/weather/current?${query}`, { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) showWeatherMessage('Địa điểm chưa có dữ liệu');
      else if (response.status === 429) showWeatherMessage('Thử lại sau ít phút');
      else showWeatherMessage('Chưa kết nối được thời tiết');
      return;
    }
    localStorage.setItem(weatherPreferenceKey, JSON.stringify({ latitude, longitude, savedAt: Date.now(), data: result }));
    showWeather(result);
  }

  async function checkWeatherAvailability() {
    try {
      const response = await fetch('/api/weather/status', { cache: 'no-store' });
      if (!response.ok || !(await response.json()).enabled) {
        weatherButton.hidden = true;
        return;
      }
      weatherButton.hidden = false;
      let preference;
      try { preference = JSON.parse(localStorage.getItem(weatherPreferenceKey) || 'null'); } catch { /* Weather remains opt-in. */ }
      if (preference && Number.isFinite(Number(preference.latitude)) && Number.isFinite(Number(preference.longitude))) {
        if (preference.data) showWeather(preference.data);
        if (!preference.savedAt || Date.now() - Number(preference.savedAt) >= 5 * 60 * 1000) {
          await loadWeather(Number(preference.latitude), Number(preference.longitude));
        }
      }
    } catch { weatherButton.hidden = true; }
  }

  weatherButton.addEventListener('click', () => {
    let preference;
    try { preference = JSON.parse(localStorage.getItem(weatherPreferenceKey) || 'null'); } catch { /* Ask for permission below. */ }
    if (preference && Number.isFinite(Number(preference.latitude)) && Number.isFinite(Number(preference.longitude))) {
      loadWeather(Number(preference.latitude), Number(preference.longitude)).catch(() => showWeatherMessage('Chưa kết nối được thời tiết'));
      return;
    }
    if (!navigator.geolocation) { showWeatherMessage('Trình duyệt không hỗ trợ vị trí'); return; }
    weatherButton.disabled = true;
    weatherButton.textContent = 'Đang lấy vị trí';
    navigator.geolocation.getCurrentPosition(position => {
      loadWeather(position.coords.latitude, position.coords.longitude).catch(() => showWeatherMessage('Chưa kết nối được thời tiết'));
    }, error => {
      showWeatherMessage(error.code === error.PERMISSION_DENIED ? 'Bạn chưa cho phép vị trí' : 'Không lấy được vị trí');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 });
  });

  weatherDisable.addEventListener('click', () => {
    try { localStorage.removeItem(weatherPreferenceKey); } catch { /* Also clear the current visual state. */ }
    delete document.documentElement.dataset.weather;
    weatherScene?.remove();
    weatherScene = null;
    weatherSummary.hidden = true;
    weatherCredit.hidden = true;
    weatherUpdated.hidden = true;
    weatherDisable.hidden = true;
    weatherButton.textContent = 'Thời tiết';
    weatherButton.disabled = false;
  });

  checkWeatherAvailability();
  window.setInterval(() => {
    if (document.visibilityState !== 'visible' || !weatherSummary || weatherSummary.hidden) return;
    try {
      const saved = JSON.parse(localStorage.getItem(weatherPreferenceKey) || 'null');
      if (saved && Number.isFinite(Number(saved.latitude)) && Number.isFinite(Number(saved.longitude))) {
        loadWeather(Number(saved.latitude), Number(saved.longitude)).catch(() => {});
      }
    } catch { /* Skip background refresh when browser storage is disabled. */ }
  }, 10 * 60 * 1000);
})();
