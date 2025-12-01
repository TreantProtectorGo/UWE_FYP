import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trafficAPI } from '../services/api';

const TrafficNews = () => {
  const { t } = useTranslation();
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrafficNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trafficAPI.getTrafficNews();
      setTrafficData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficNews();
  }, []);

  const getTypeColor = (type) => {
    const colors = {
      accident: 'bg-red-100 text-red-800 border-red-200',
      roadClosure: 'bg-orange-100 text-orange-800 border-orange-200',
      construction: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      congestion: 'bg-blue-100 text-blue-800 border-blue-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-gray-600">{t('trafficNews.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">{t('trafficNews.error')}: {error}</p>
        <button
          onClick={fetchTrafficNews}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
        >
          {t('trafficNews.refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t('trafficNews.title')}</h1>
        <button
          onClick={fetchTrafficNews}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('trafficNews.refresh')}
        </button>
      </div>

      {trafficData.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{t('trafficNews.noData')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {trafficData.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(item.type)}`}>
                      {t(`trafficNews.types.${item.type}`)}
                    </span>
                    <span className="text-sm text-gray-500">{item.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.location}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrafficNews;
