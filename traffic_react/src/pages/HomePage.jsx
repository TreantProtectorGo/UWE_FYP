import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trafficAPI, aiAPI, mtrAPI } from '../services/api';
import MapPicker from '../components/MapPicker';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  
  // Traffic News State
  const [trafficData, setTrafficData] = useState([]);
  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [errorTraffic, setErrorTraffic] = useState(null);

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
      setErrorTraffic(null); // 清除錯誤，因為我們使用了模擬資料
    } finally {
      setLoadingTraffic(false);
    }
  };

  useEffect(() => {
    fetchTrafficNews();
    fetchMtrStatus();
  }, [i18n.language]); // 當語言改變時重新抓取資料

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
      return;
    }

    setLoadingRoute(true);
    setErrorRoute(null);
    setResult(null);

    try {
      const data = await aiAPI.checkRoute(origin, destination);
      setResult(data);
    } catch (err) {
      // 當 API 錯誤時，使用模擬資料
      console.log('AI API Error, using mock data:', err.message);
      
      // 檢查是否有相關的交通問題
      const relatedIssues = trafficData.filter(item => {
        const searchText = `${origin} ${destination}`.toLowerCase();
        const itemText = item.location.toLowerCase();
        
        // 簡單的關鍵字匹配
        const keywords = ['中環', 'central', '尖沙咀', 'tsim sha tsui', '銅鑼灣', 'causeway bay', 
                         '紅磡', 'hung hom', '觀塘', 'kwun tong', '海底隧道', 'tunnel'];
        
        return keywords.some(keyword => 
          (searchText.includes(keyword) && itemText.includes(keyword))
        );
      });

      const mockResult = {
        origin,
        destination,
        issues: relatedIssues.length > 0 ? relatedIssues.map(item => ({
          location: item.location,
          description: item.description,
          suggestion: '請留意路面情況 / Please watch road conditions'
        })) : []
      };
      
      setResult(mockResult);
      setErrorRoute(null); // 清除錯誤，因為我們使用了模擬資料
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setResult(null);
    setErrorRoute(null);
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
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <ul className="divide-y divide-gray-200">
              {trafficData.map((item) => (
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
                    title={i18n.language === 'zh' ? '從地圖選擇' : 'Select from map'}
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
                    title={i18n.language === 'zh' ? '從地圖選擇' : 'Select from map'}
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
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  {t('aiCheck.checking')}
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

          {(result || errorRoute) && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full px-4 py-3 mb-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium border border-gray-200"
            >
              {t('aiCheck.clear')}
            </button>
          )}

          {/* AI Results */}
          {errorRoute && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{t('aiCheck.error')}</p>
            </div>
          )}

          {result && result.ai_analysis && (
            <div className="mt-4 space-y-3">
              {/* AI Summary with Severity Badge */}
              <div className={`rounded-lg p-4 border-2 ${
                result.ai_analysis.severity === 'high' 
                  ? 'bg-red-50 border-red-300'
                  : result.ai_analysis.severity === 'medium'
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    result.ai_analysis.severity === 'high' ? 'text-red-600'
                    : result.ai_analysis.severity === 'medium' ? 'text-orange-600'
                    : 'text-green-600'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">
                      {i18n.language === 'zh' ? result.ai_analysis.summary_tc : result.ai_analysis.summary_eng}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              {result.ai_analysis.suggestions && result.ai_analysis.suggestions.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-sm text-purple-800">
                      {i18n.language === 'zh' ? 'AI 建議' : 'AI Suggestions'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.ai_analysis.suggestions.map((sug, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">
                            {i18n.language === 'zh' ? sug.method_tc : sug.method_eng}
                          </span>
                          <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            {sug.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {i18n.language === 'zh' ? sug.reason_tc : sug.reason_eng}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Issues (Optional - show count) */}
              {result.ai_analysis.affected_issues && result.ai_analysis.affected_issues.length > 0 && (
                <div className="text-xs text-gray-500 text-center">
                  {i18n.language === 'zh' 
                    ? `已分析 ${result.ai_analysis.affected_issues.length} 個相關交通問題`
                    : `Analyzed ${result.ai_analysis.affected_issues.length} related traffic issues`
                  }
                </div>
              )}
            </div>
          )}

          {/* Fallback: Old format support */}
          {result && !result.ai_analysis && result.issues && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-800">
                <svg className="w-5 h-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('aiCheck.result')}
              </h3>

              {result.issues && result.issues.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-medium text-sm text-gray-700">{t('aiCheck.issuesFound')}:</p>
                  <div className="space-y-2">
                    {result.issues.map((issue, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3 text-gray-800 border border-gray-200 shadow-sm"
                      >
                        <div className="font-semibold mb-1.5 text-sm">{issue.location}</div>
                        <div className="text-gray-600 mb-1.5 text-xs">{issue.description}</div>
                        {issue.suggestion && (
                          <div className="mt-1.5 bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-blue-800">
                              <span className="font-medium">💡</span> {issue.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('aiCheck.noIssues')}
                  </p>
                </div>
              )}
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
