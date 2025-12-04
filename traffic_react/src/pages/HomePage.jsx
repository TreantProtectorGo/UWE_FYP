import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trafficAPI, aiAPI, mtrAPI } from '../services/api';
import MapPicker from '../components/MapPicker';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  
  // Traffic News State
  const [trafficData, setTrafficData] = useState([]);
  const [filteredTrafficData, setFilteredTrafficData] = useState([]);
  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [errorTraffic, setErrorTraffic] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // AI Route Check State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [result, setResult] = useState(null);
  const [errorRoute, setErrorRoute] = useState(null);
  
  // Map Picker State
  const [showOriginMap, setShowOriginMap] = useState(false);
  const [showDestMap, setShowDestMap] = useState(false);
  
  // MTR State
  const [mtrData, setMtrData] = useState([]);
  const [loadingMtr, setLoadingMtr] = useState(true);
  const [errorMtr, setErrorMtr] = useState(null);

  const fetchTrafficNews = async () => {
    setLoadingTraffic(true);
    setErrorTraffic(null);
    try {
      const data = await trafficAPI.getTrafficNews();
      console.log('API Response:', data);
      
      // 處理不同的資料格式並轉換為前端需要的格式
      let processedData = [];
      const isChinese = i18n.language === 'zh';
      
      if (Array.isArray(data)) {
        processedData = data.map(item => ({
          id: item.id,
          location: isChinese ? (item.msgtc || item.msgeng || '未知地點') : (item.msgeng || item.msgtc || 'Unknown'),
          time: item.time,
          datasource: item.datasource || 'traffic'
        }));
      } else if (data && Array.isArray(data.data)) {
        processedData = data.data.map(item => ({
          id: item.id,
          location: isChinese ? (item.msgtc || item.msgeng || '未知地點') : (item.msgeng || item.msgtc || 'Unknown'),
          time: item.time,
          datasource: item.datasource || 'traffic'
        }));
      } else {
        console.log('Unexpected data format, using mock data');
        throw new Error('Invalid data format');
      }
      
      // 按時間排序（最新的在前）
      processedData.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      setTrafficData(processedData);
      setFilteredTrafficData(processedData);
    } catch (err) {
      // 當 API 錯誤時，使用模擬資料
      console.log('API Error, using mock data:', err.message);
      
      const mockData = [
        {
          id: 1,
          location: '中環德輔道中 / Central, Des Voeux Road',
          description: '交通意外，一線封閉 / Traffic accident, one lane closed',
          time: new Date().toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          datasource: 'TD'
        },
        {
          id: 2,
          location: '尖沙咀彌敦道 / Tsim Sha Tsui, Nathan Road',
          description: '道路維修，全線封閉至下午3時 / Road maintenance, fully closed until 3pm',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 3,
          location: '銅鑼灣軒尼詩道 / Causeway Bay, Hennessy Road',
          description: '道路工程進行中，請改用電車路 / Construction work in progress, use Tram Road instead',
          time: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 4,
          location: '紅磡海底隧道 / Cross Harbour Tunnel',
          description: '交通擠塞，預計延誤15分鐘 / Heavy traffic, expect 15 min delay',
          time: new Date(Date.now() - 30 * 60 * 1000).toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 5,
          location: '觀塘道近牛頭角站 / Kwun Tong Road near Ngau Tau Kok',
          description: '輕微交通意外，慢線受阻 / Minor accident, slow lane blocked',
          time: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 6,
          location: '西區海底隧道 / Western Harbour Crossing',
          description: '車流量大，行車緩慢 / High traffic volume, slow moving',
          time: new Date(Date.now() - 45 * 60 * 1000).toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        }
      ];
      
      setTrafficData(mockData);
      setFilteredTrafficData(mockData);
      setErrorTraffic(null); // 清除錯誤，因為我們使用了模擬資料
    } finally {
      setLoadingTraffic(false);
    }
  };

  useEffect(() => {
    fetchTrafficNews();
    fetchMtrStatus();
  }, [i18n.language]); // 當語言改變時重新抓取資料

  // Filter traffic data when date changes or tab changes
  useEffect(() => {
    filterTrafficData();
  }, [startDate, endDate, trafficData, activeTab]);

  const filterTrafficData = () => {
    let filtered = trafficData;

    // Apply tab filter first (today or all)
    if (activeTab === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = trafficData.filter(item => {
        const itemDate = new Date(item.time);
        return itemDate >= today && itemDate < tomorrow;
      });
    }

    // Apply date range filter (only in 'all' tab)
    if (activeTab === 'all' && (startDate || endDate)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.time);
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;

        if (start && end) {
          return itemDate >= start && itemDate <= end;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          return itemDate <= end;
        }
        return true;
      });
    }

    setFilteredTrafficData(filtered);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const fetchMtrStatus = async () => {
    setLoadingMtr(true);
    setErrorMtr(null);
    try {
      const data = await mtrAPI.getAll();
      // Normalize to { line, lineEng, status, statusEng, time }
      const processed = (Array.isArray(data) ? data : (data.data || [])).map(item => ({
        line: item.line,
        lineEng: item.lineEng,
        status: item.status,
        statusEng: item.statusEng,
        time: item.time,
      }));

      // sort by time desc if present
      processed.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      setMtrData(processed);
    } catch (err) {
      console.error('MTR API error', err);
      setErrorMtr(err.message || 'Error');
    } finally {
      setLoadingMtr(false);
    }
  };

  const handleCheckRoute = async (e) => {
    e.preventDefault();
    
    if (!origin.trim() || !destination.trim()) {
      alert(t('aiCheck.errorInputRequired'));
      return;
    }

    setLoadingRoute(true);
    setErrorRoute(null);
    setResult(null);

    try {
      const response = await aiAPI.checkRoute(origin, destination);
      setResult(response);
    } catch (err) {
      console.error('AI Route Check Error:', err);
      setErrorRoute(err.message || t('aiCheck.error'));
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="flex gap-6">
      {/* Traffic News Section - Left 70% */}
      <div className="flex-1">
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t('trafficNews.today')}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t('trafficNews.all')}
          </button>
        </div>
        
        {/* Date Filter - Only show in 'all' tab */}
        {activeTab === 'all' && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t('filter.startDate')}:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t('filter.endDate')}:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilter}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                {t('filter.clear')}
              </button>
            )}
            <div className="ml-auto text-sm text-gray-600">
              {t('filter.total')} {filteredTrafficData.length} {t('filter.messages')}
            </div>
          </div>
        </div>
        )}

        {loadingTraffic ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">{t('trafficNews.loading')}</p>
          </div>
        ) : errorTraffic ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{t('trafficNews.error')}: {errorTraffic}</p>
            <button
              onClick={fetchTrafficNews}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              {t('trafficNews.refresh')}
            </button>
          </div>
        ) : trafficData.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">{t('trafficNews.noData')}</p>
          </div>
        ) : filteredTrafficData.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">{t('filter.noMatchTraffic')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <ul className="divide-y divide-gray-200">
              {filteredTrafficData.map((item) => (
                <li
                  key={item.id}
                  className="py-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-500">{item.time}</span>
                        {item.datasource && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                            {item.datasource.toLowerCase() === 'rthk' ? 'RTHK' : item.datasource.toLowerCase() === 'gov' ? 'GOV' : item.datasource}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-gray-800">
                        {item.location}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Route Check Section - Right 30% */}
      <div className="w-[30%]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7 sticky top-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
            {t('aiCheck.smartTitle')}
          </h2>

          <form onSubmit={handleCheckRoute} className="relative mb-6">
            {/* Connecting Line */}
            <div className="absolute left-3 top-12 bottom-[104px] w-0.5 bg-gradient-to-b from-blue-300 via-gray-200 to-red-300 z-0"></div>

            {/* Origin Input */}
            <div className="flex items-start gap-3 mb-4 relative">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-3 z-10 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                <label className="block text-xs text-gray-400 font-medium mb-1">{t('aiCheck.origin')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder={t('aiCheck.originPlaceholder')}
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOriginMap(true)}
                    className="p-1 hover:bg-gray-200 rounded transition flex-shrink-0"
                    title={t('aiCheck.selectFromMap')}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className="absolute right-0 top-[58px] p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 hover:border-blue-300 text-gray-500 hover:text-blue-600 z-20 transition-all active:scale-95"
              title={t('aiCheck.swapTooltip')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>

            {/* Destination Input */}
            <div className="flex items-start gap-3 mb-6 relative">
              <div className="w-6 h-6 flex items-center justify-center mt-3 z-10 flex-shrink-0">
                <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                <label className="block text-xs text-gray-400 font-medium mb-1">{t('aiCheck.destination')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={t('aiCheck.destinationPlaceholder')}
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDestMap(true)}
                    className="p-1 hover:bg-gray-200 rounded transition flex-shrink-0"
                    title={t('aiCheck.selectFromMap')}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingRoute}
              className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-semibold py-3 rounded-xl shadow-lg shadow-gray-400/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loadingRoute ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t('aiCheck.analyzing')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('aiCheck.findRoute')}
                </>
              )}
            </button>

          </form>

          {/* AI Analysis Result */}
          {errorRoute && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{errorRoute}</p>
            </div>
          )}

          {result && result.success && (
            <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">
                    {t('aiCheck.aiResult')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {i18n.language === 'zh' ? result.summary_tc : result.summary_eng}
                  </p>
                </div>
              </div>

              {/* Affected Issues */}
              {result.affectedIssues && result.affectedIssues.length > 0 && (
                <div className="bg-white/60 rounded-lg p-3">
                  <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">
                    {t('aiCheck.affectedIssues')}
                  </h5>
                  <ul className="space-y-2">
                    {result.affectedIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          issue.severity === 'high' ? 'bg-red-500' :
                          issue.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-sm text-gray-700">
                          {i18n.language === 'zh' ? issue.title_tc : issue.title_eng}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestion */}
              <div className="bg-white/60 rounded-lg p-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">
                  {t('aiCheck.suggestion')}
                </h5>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {i18n.language === 'zh' ? result.suggestion_tc : result.suggestion_eng}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-right">
                {t('aiCheck.checkedAt')}: {result.checkedAt}
              </div>
            </div>
          )}

          {/* MTR Service Status */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{t('mtr.status')}</h3>
            {loadingMtr ? (
              <div className="text-xs text-gray-500 text-center py-4">{t('mtr.loading')}</div>
            ) : errorMtr ? (
              <div className="text-xs text-red-600 text-center py-4">{t('mtr.error')}</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {mtrData.map((line) => {
                  const name = i18n.language === 'zh' ? (line.line || line.lineEng) : (line.lineEng || line.line);
                  const statusText = i18n.language === 'zh' ? (line.status || '') : (line.statusEng || '');
                  const isNonService = /非服務時間|non-service|closed/i.test(statusText);
                  const isGood = !statusText || /good|normal|正常|service/i.test(statusText);
                  
                  // MTR Line Colors (Official Hong Kong MTR colors)
                  const lineColors = {
                    '屯馬綫': '#9A3820', '屯馬線': '#9A3820', 'Tuen Ma Line': '#9A3820',
                    '東涌綫': '#F38B00', '東涌線': '#F38B00', 'Tung Chung Line': '#F38B00',
                    '東鐵綫': '#5CE1E6', '東鐵線': '#5CE1E6', 'East Rail Line': '#5CE1E6',
                    '荃灣綫': '#FF0000', '荃灣線': '#FF0000', 'Tsuen Wan Line': '#FF0000',
                    '港島綫': '#0860A8', '港島線': '#0860A8', 'Island Line': '#0860A8',
                    '觀塘綫': '#00A040', '觀塘線': '#00A040', 'Kwun Tong Line': '#00A040',
                    '南港島綫': '#CBB900', '南港島線': '#CBB900', 'South Island Line': '#CBB900',
                    '將軍澳綫': '#7B3F94', '將軍澳線': '#7B3F94', 'Tseung Kwan O Line': '#7B3F94',
                    '迪士尼綫': '#F550A8', '迪士尼線': '#F550A8', 'Disneyland Resort Line': '#F550A8',
                    '機場快綫': '#1C7670', '機場快線': '#1C7670', 'Airport Express': '#1C7670'
                  };
                  
                  const lineColor = lineColors[name] || '#6B7280';
                  
                  return (
                    <li key={name} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: lineColor }}></div>
                        <span className="font-medium text-gray-700 text-sm truncate">{name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 flex-shrink-0 ml-2 ${
                        isNonService 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : isGood 
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}>
                        {isNonService && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {!isNonService && isGood && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="whitespace-nowrap">{statusText || t('mtr.goodService')}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
        </div>
      </div>

      {/* Map Pickers */}
      <MapPicker
        isOpen={showOriginMap}
        onClose={() => setShowOriginMap(false)}
        onSelectLocation={(location) => setOrigin(location)}
        title={t('aiCheck.origin')}
      />
      
      <MapPicker
        isOpen={showDestMap}
        onClose={() => setShowDestMap(false)}
        onSelectLocation={(location) => setDestination(location)}
        title={t('aiCheck.destination')}
      />
    </div>
  );
};

export default HomePage;
