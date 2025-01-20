/***************************************************
 * server.js
 * Node.js + Express で OpenWeatherMap へのリクエストを
 * 代理して行うサーバーサイド実装例
 ****************************************************/
require('dotenv').config();  // .envファイルを読み込み
const express = require('express');
const fetch = require('node-fetch'); // Node.js用の fetch
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 環境変数から API Key を取得
const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

// public フォルダを静的配信
app.use(express.static(path.join(__dirname, '../public')));

/**
 * [GET] /weather
 * クエリとして city (都市名) を受け取り、OpenWeatherMap の現在天気データを返す
 * 例: /weather?city=Tokyo
 */
app.get('/weather', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) {
      return res.status(400).json({ error: 'Missing city parameter' });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&lang=ja`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch current weather' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * [GET] /forecast
 * クエリとして city (都市名) を受け取り、OpenWeatherMap の天気予報データを返す
 * 例: /forecast?city=Tokyo
 */
app.get('/forecast', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) {
      return res.status(400).json({ error: 'Missing city parameter' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&lang=ja`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch forecast' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
