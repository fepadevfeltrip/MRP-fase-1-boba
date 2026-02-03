
import React, { useEffect, useRef, useState } from 'react';
import { LivingMarker, UserLocation } from '../types';

// Declaração global do Leaflet carregado via CDN
declare var L: any;

interface LivingMapProps {
  markers: LivingMarker[];
  userLocation?: UserLocation;
  ui: any;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerEdit?: (marker: LivingMarker) => void;
  interactiveMode?: boolean; 
}

export const LivingMap: React.FC<LivingMapProps> = ({ markers, userLocation, ui, onMapClick, onMarkerEdit }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Coordenadas padrão (Rio de Janeiro)
  const defaultCenter = [ -22.9068, -43.1729 ]; // Leaflet usa [lat, lng]
  const center = userLocation?.latitude && userLocation?.longitude 
    ? [ userLocation.latitude, userLocation.longitude ] 
    : defaultCenter;

  const TYPE_COLORS: Record<string, string> = {
    presence: '#FF007F', 
    place: '#EAA823',    
    culture: '#006A71'   
  };

  useEffect(() => {
    const checkLeaflet = () => {
        if ((window as any).L) {
            initMap();
        } else {
            setTimeout(checkLeaflet, 100);
        }
    };

    const initMap = () => {
        if (!mapContainer.current) return;
        if (mapInstance.current) {
            mapInstance.current.remove(); 
            mapInstance.current = null;
        }

        try {
            console.log("Inicializando Leaflet...");
            
            const map = L.map(mapContainer.current, {
                center: center,
                zoom: 13,
                zoomControl: false,
                attributionControl: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Clique no Mapa - Sempre ativo
            map.on('click', (e: any) => {
                // Se clicar em um marcador, o evento de clique do mapa também dispara.
                // Mas o handler do marcador previne isso se usarmos stopPropagation, 
                // mas aqui vamos deixar o onMapClick apenas para criar novos.
                if (onMapClick) {
                    onMapClick(e.latlng.lat, e.latlng.lng);
                }
            });

            mapInstance.current = map;
            setStatus('ready');

        } catch (e) {
            console.error("Erro ao iniciar Leaflet:", e);
        }
    };

    checkLeaflet();

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, []); 

  // Efeito para renderizar marcadores
  useEffect(() => {
      if (!mapInstance.current || status !== 'ready') return;
      const map = mapInstance.current;

      if (!map.markersLayer) {
          map.markersLayer = L.layerGroup().addTo(map);
      } else {
          map.markersLayer.clearLayers();
      }

      markers.forEach(marker => {
          const color = TYPE_COLORS[marker.type] || '#006A71';

          const iconHtml = `
            <div style="
                background-color: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                transition: transform 0.2s;
            "></div>
          `;

          const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: iconHtml,
              iconSize: [24, 24],
              iconAnchor: [12, 12], 
              popupAnchor: [0, -12]
          });

          // Adiciona o marcador
          const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon })
           .addTo(map.markersLayer);
           
          // Adiciona evento de clique para edição
          leafletMarker.on('click', (e: any) => {
             L.DomEvent.stopPropagation(e); // Previne que o mapa receba o clique e abra o modal de "Criar Novo"
             if (onMarkerEdit) {
                 onMarkerEdit(marker);
             }
          });
          
          // Tooltip simples ao passar o mouse (opcional)
          leafletMarker.bindTooltip(marker.type.toUpperCase(), { 
              direction: 'top', 
              offset: [0, -10],
              opacity: 0.8 
          });
      });

  }, [markers, status, onMarkerEdit]);

  // Função de Busca
  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim() || !mapInstance.current) return;

      setIsSearching(true);
      try {
          // Busca Nominatim (OpenStreetMap)
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
          const results = await response.json();

          if (results && results.length > 0) {
              const { lat, lon } = results[0];
              const latitude = parseFloat(lat);
              const longitude = parseFloat(lon);

              // Move o mapa
              mapInstance.current.flyTo([latitude, longitude], 15);
              
              // Dispara o modal de adição de nota
              if (onMapClick) {
                  onMapClick(latitude, longitude);
              }
          } else {
              alert("Endereço não encontrado.");
          }
      } catch (err) {
          console.error("Erro na busca:", err);
      } finally {
          setIsSearching(false);
      }
  };

  return (
      <div className="w-full h-full relative group bg-gray-100 flex flex-col">
          {/* Barra de Busca Flutuante - Z-Index reduzido para 10 para ficar abaixo dos modais (z-2000) */}
          <div className="absolute top-4 left-4 right-14 z-10 max-w-md">
              <form onSubmit={handleSearch} className="relative shadow-lg rounded-xl">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={ui.searchPlaceholder || "Search address..."}
                    className="w-full py-3 pl-10 pr-4 bg-white rounded-xl text-sm border-0 focus:ring-2 focus:ring-[#006A71] outline-none text-gray-700 placeholder-gray-400"
                  />
                  <div className="absolute left-3 top-3 text-gray-400">
                     {isSearching ? (
                        <div className="w-4 h-4 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                     )}
                  </div>
              </form>
          </div>

          {/* Container do Mapa */}
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ minHeight: '100%', zIndex: 0 }} />
          
          {/* Status Loading Inicial */}
          {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                  <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-[#006A71] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-[#006A71] text-xs font-bold uppercase tracking-wider">Carregando Mapa...</p>
                  </div>
              </div>
          )}
      </div>
  );
};
