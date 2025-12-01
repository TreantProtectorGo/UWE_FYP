import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Hong Kong bounds
const HK_BOUNDS = [
  [22.15, 113.82],  // Southwest
  [22.58, 114.45]   // Northeast
];

const HK_CENTER = [22.3193, 114.1694]; // Hong Kong center

const MapPicker = ({ isOpen, onClose, onSelectLocation, title }) => {
  const { t, i18n } = useTranslation();
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        
        // Check if within Hong Kong bounds
        if (lat < 22.15 || lat > 22.58 || lng < 113.82 || lng > 114.45) {
          alert(i18n.language === 'zh' ? '請選擇香港範圍內的位置' : 'Please select a location within Hong Kong');
          return;
        }
        
        setSelectedPosition([lat, lng]);
        setLoading(true);
        
        // Reverse geocoding using Nominatim
        fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${lat}&lon=${lng}&` +
          `countrycodes=hk&` +
          `format=json&` +
          `accept-language=${i18n.language === 'zh' ? 'zh-TW,zh' : 'en'}`
        )
          .then(res => res.json())
          .then(data => {
            let locationName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            
            // Remove "Hong Kong, China" and postal codes from address
            locationName = locationName
              // Remove country names
              .replace(/, Hong Kong, China$/, '')
              .replace(/, Hong Kong$/, '')
              .replace(/, 中華人民共和國香港特別行政區$/, '')
              .replace(/, 香港特別行政區$/, '')
              .replace(/, 香港$/, '')
              .replace(/, China$/, '')
              .replace(/, 中華人民共和國$/, '')
              .replace(/, 中国$/, '')
              // Remove postal codes (6 digits)
              .replace(/, \d{6}/, '')
              .replace(/ \d{6}/, '')
              // Remove any remaining country references in the middle
              .replace(/ Hong Kong,?/g, '')
              .replace(/ 香港,?/g, '')
              // Clean up any double commas or trailing commas
              .replace(/,\s*,/g, ',')
              .replace(/,\s*$/, '')
              .trim();
            
            setAddress(locationName);
          })
          .catch(err => {
            console.error('Geocoding error:', err);
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          })
          .finally(() => {
            setLoading(false);
          });
      },
    });

    return selectedPosition ? <Marker position={selectedPosition} /> : null;
  }

  const handleConfirm = () => {
    if (address) {
      onSelectLocation(address);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Map */}
        <div className="relative">
          <MapContainer 
            center={HK_CENTER}
            zoom={11}
            maxBounds={HK_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={10}
            maxZoom={18}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <LocationMarker />
          </MapContainer>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Selected Address and Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-4">
          {/* Selected Address */}
          <div className="flex-1 min-w-0">
            {address ? (
              <>
                <p className="text-sm text-gray-600 mb-1">
                  {i18n.language === 'zh' ? '已選擇：' : 'Selected:'}
                </p>
                <p className="text-gray-800 font-medium truncate">{address}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                {i18n.language === 'zh' ? '請在地圖上點選位置' : 'Click on the map to select a location'}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              {i18n.language === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!address}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {i18n.language === 'zh' ? '確認' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
