import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { specialTrafficAPI } from '../services/api';

const SpecialTraffic = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    fetchData();
  }, [i18n.language, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = activeTab === 'active' 
        ? await specialTrafficAPI.getActive()
        : await specialTrafficAPI.getHistory();
      // Sort by time desc
      const sorted = result.sort((a, b) => new Date(b.time) - new Date(a.time));
      setData(sorted);
    } catch (err) {
      console.error('Error fetching special traffic arrangements:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const closePopup = () => {
    setSelectedItem(null);
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {t('specialTraffic.active')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {t('specialTraffic.history')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">{t('trafficNews.loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{t('trafficNews.noData')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <ul className="divide-y divide-gray-200">
            {data.map((item) => (
              <li
                key={item.tnId}
                className="py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">
                        {t('specialTraffic.updated')}{item.time}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {i18n.language === 'zh' ? item.title_tc : item.title_eng}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popup Modal */}
      {selectedItem && (
        <div 
          // CHANGE HERE: use 'bg-black/50' instead of 'bg-black bg-opacity-50'
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={closePopup}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="text-sm text-gray-500 mb-4">
                {t('specialTraffic.updated')}{selectedItem.time}
              </div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: i18n.language === 'zh' ? selectedItem.content_tc : selectedItem.content_eng 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialTraffic;
