/***************************************************
 * Advanced Weather App - JavaScript (Front-end)
 ****************************************************/

/**
 * 【ポイント】
 * - サーバーサイド (Express) 経由で OpenWeatherMap API へリクエスト
 * - Chart.jsを利用したグラフ描画
 * - LocalStorageを用いた検索履歴の保存・読み込み
 * - DOM操作・イベント処理・エラーハンドリング
 */

// サーバー側のエンドポイントURL (同じホストであれば相対パスでも可)
const SERVER_BASE_URL = "";

// 各要素の取得
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentWeatherEl = document.getElementById("currentWeather");
const forecastChartEl = document.getElementById("forecastChart");
const historyListEl = document.getElementById("historyList");

let forecastChart; // Chart.jsのインスタンス

/**
 * 現在の天気を表示する
 * @param {Object} data - 現在の天気データ
 */
function displayCurrentWeather(data) {
  const tempC = (data.main.temp - 273.15).toFixed(1); // 摂氏に変換
  const feelsLikeC = (data.main.feels_like - 273.15).toFixed(1);
  const humidity = data.main.humidity;
  const description = data.weather[0].description;
  const icon = data.weather[0].icon;
  const windSpeed = data.wind.speed;
  const cityName = data.name;

  // アイコンURL生成
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  // HTML組み立て
  currentWeatherEl.innerHTML = `
    <h2>${cityName} の天気</h2>
    <div class="weather-row">
      <img src="${iconUrl}" alt="${description}" />
      <div>
        <p><strong>気温:</strong> ${tempC}℃</p>
        <p><strong>体感温度:</strong> ${feelsLikeC}℃</p>
        <p><strong>湿度:</strong> ${humidity}%</p>
        <p><strong>天気:</strong> ${description}</p>
        <p><strong>風速:</strong> ${windSpeed} m/s</p>
      </div>
    </div>
  `;
}

/**
 * 3時間おきの予報データをグラフ表示する
 * @param {Object} forecastData - 天気予報データ
 */
function displayForecastChart(forecastData) {
  // グラフが既にあれば破棄して再描画
  if (forecastChart) {
    forecastChart.destroy();
  }

  // 3時間おきに5回分(約15時間)のデータを取得
  const slicedData = forecastData.list.slice(0, 5);

  const labels = slicedData.map((entry) => {
    // 日時は "時刻" だけを使う
    const dateObj = new Date(entry.dt_txt);
    return `${dateObj.getHours()}時`;
  });

  const temps = slicedData.map((entry) =>
    (entry.main.temp - 273.15).toFixed(1)
  );

  // Chart.jsの初期化
  forecastChart = new Chart(forecastChartEl, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "気温 (℃)",
          data: temps,
          borderColor: "rgba(0, 122, 204, 1)",
          backgroundColor: "rgba(0, 122, 204, 0.2)",
          fill: true,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          suggestedMin: Math.min(...temps) - 5,
          suggestedMax: Math.max(...temps) + 5,
        },
      },
    },
  });
}

/**
 * 都市名を指定して現在の天気と予報を取得する
 * @param {String} city - 都市名(ローマ字・英語)
 */
async function getWeatherData(city) {
  try {
    // 現在の天気取得: サーバー側の `/weather?city=***`
    const currentWeatherRes = await fetch(`${SERVER_BASE_URL}/weather?city=${city}`);
    if (!currentWeatherRes.ok) {
      throw new Error("現在の天気情報を取得できませんでした");
    }
    const currentWeatherData = await currentWeatherRes.json();
    displayCurrentWeather(currentWeatherData);

    // 予報取得: サーバー側の `/forecast?city=***`
    const forecastRes = await fetch(`${SERVER_BASE_URL}/forecast?city=${city}`);
    if (!forecastRes.ok) {
      throw new Error("天気予報を取得できませんでした");
    }
    const forecastData = await forecastRes.json();
    displayForecastChart(forecastData);

    // 成功したら履歴に追加
    addCityToHistory(city);
  } catch (error) {
    alert(error.message);
  }
}

/**
 * 検索履歴をLocalStorageに保存し、画面にも反映する
 * @param {String} city - 都市名
 */
function addCityToHistory(city) {
  // LocalStorageから既存の履歴を取得
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  // 重複を排除して末尾に追加
  history = history.filter((item) => item.toLowerCase() !== city.toLowerCase());
  history.push(city);

  // 履歴をLocalStorageに保存
  localStorage.setItem("weatherHistory", JSON.stringify(history));

  // リストを再描画
  renderHistory();
}

/**
 * LocalStorageに保存された履歴を取得してリストを表示する
 */
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  historyListEl.innerHTML = "";

  // 最新が右側に来るように描画
  history.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    // クリックしたらその都市で検索
    li.addEventListener("click", () => {
      cityInput.value = city;
      getWeatherData(city);
    });
    historyListEl.appendChild(li);
  });
}

/**
 * 初期化処理
 */
function init() {
  // 履歴を描画
  renderHistory();

  // 検索ボタンのイベント
  searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
      getWeatherData(city);
    }
  });

  // Enterキーでも検索
  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const city = cityInput.value.trim();
      if (city) {
        getWeatherData(city);
      }
    }
  });
}

// DOM読み込み完了後に初期化
window.addEventListener("DOMContentLoaded", init);
