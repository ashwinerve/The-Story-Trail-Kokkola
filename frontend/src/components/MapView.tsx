import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Navigation, Locate, AlertCircle, Compass } from 'lucide-react';
import { useGetAllLocationsWithCoordinates, useGetUserProgress } from '../hooks/useQueries';
import type { StoryLocation, PublicLocationInfo } from '../backend';

interface MapViewProps {
  onLocationSelect: (location: StoryLocation) => void;
}

// Declare Leaflet types for CDN usage
declare global {
  interface Window {
    L: any;
  }
}

// Location coordinates - Updated Location 2 to Halkokari skirmish monument
const LOCATION_1_COORDS = {
  latitude: 63.83993,
  longitude: 23.12778,
};

const LOCATION_2_COORDS = {
  latitude: 63.859999,
  longitude: 23.118352,
};

export default function MapView({ onLocationSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const locationMarkersRef = useRef<Map<string, any>>(new Map());
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  const { data: locations, isLoading: locationsLoading } = useGetAllLocationsWithCoordinates();
  const { data: userProgress } = useGetUserProgress();

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Leaflet');
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !leafletLoaded) return;

    const L = window.L;
    
    // Fix for default marker icons in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Center on Kokkola, Finland
    const map = L.map(mapRef.current, {
      center: [63.8378, 23.1310],
      zoom: 13,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles',
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Add location markers including Location 1 and Location 2
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !leafletLoaded) return;

    const L = window.L;
    
    // Clear existing markers
    locationMarkersRef.current.forEach(marker => marker.remove());
    locationMarkersRef.current.clear();

    const completedIds = new Set(
      userProgress?.completedLocations.map(num => Number(num)) || []
    );

    // Add Location 1 marker with updated title and description
    const location1 = {
      id: 'location_1',
      title: 'Neristan – The Old Wooden Town',
      sequenceNumber: BigInt(1),
      nextLocationHint: 'Seek out a porcelain dog in a window...',
      coordinates: LOCATION_1_COORDS,
    };

    const isLocation1Completed = completedIds.has(1);

    const location1IconHtml = `
      <div class="relative">
        <div class="absolute -inset-2 bg-primary/20 rounded-full animate-pulse"></div>
        <div class="relative flex items-center justify-center">
          <img src="/assets/generated/location-marker.dim_32x32.png" alt="Location" class="w-10 h-10 drop-shadow-lg ${isLocation1Completed ? 'opacity-100' : 'opacity-70'}" />
          <span class="absolute text-white font-bold text-xs drop-shadow-md">1</span>
        </div>
        ${isLocation1Completed ? '<img src="/assets/generated/completed-check.dim_24x24.png" alt="Completed" class="absolute -top-1 -right-1 w-5 h-5 drop-shadow-lg" />' : ''}
      </div>
    `;

    const location1Icon = L.divIcon({
      html: location1IconHtml,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const location1Marker = L.marker([LOCATION_1_COORDS.latitude, LOCATION_1_COORDS.longitude], {
      icon: location1Icon,
    }).addTo(mapInstanceRef.current);

    const location1PopupContent = `
      <div class="p-3 min-w-[220px]">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Location 1
          </span>
          ${isLocation1Completed ? '<span class="text-green-600 text-xs font-semibold">✓ Completed</span>' : ''}
        </div>
        <h3 class="font-bold text-base mb-2">Neristan – The Old Wooden Town</h3>
        <p class="text-sm text-gray-600 mb-3">Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?</p>
      </div>
    `;

    location1Marker.bindPopup(location1PopupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    locationMarkersRef.current.set('location_1', location1Marker);

    // Add Location 2 marker - Halkokari skirmish monument
    const location2 = {
      id: 'location_2',
      title: 'Location 2',
      sequenceNumber: BigInt(2),
      nextLocationHint: 'Find the memorial/park marker dedicated to the battle...',
      coordinates: LOCATION_2_COORDS,
    };

    const isLocation2Completed = completedIds.has(2);

    const location2IconHtml = `
      <div class="relative">
        <div class="absolute -inset-2 bg-primary/20 rounded-full animate-pulse"></div>
        <div class="relative flex items-center justify-center">
          <img src="/assets/generated/location-marker.dim_32x32.png" alt="Location" class="w-10 h-10 drop-shadow-lg ${isLocation2Completed ? 'opacity-100' : 'opacity-70'}" />
          <span class="absolute text-white font-bold text-xs drop-shadow-md">2</span>
        </div>
        ${isLocation2Completed ? '<img src="/assets/generated/completed-check.dim_24x24.png" alt="Completed" class="absolute -top-1 -right-1 w-5 h-5 drop-shadow-lg" />' : ''}
      </div>
    `;

    const location2Icon = L.divIcon({
      html: location2IconHtml,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const location2Marker = L.marker([LOCATION_2_COORDS.latitude, LOCATION_2_COORDS.longitude], {
      icon: location2Icon,
    }).addTo(mapInstanceRef.current);

    const location2PopupContent = `
      <div class="p-3 min-w-[220px]">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Location 2
          </span>
          ${isLocation2Completed ? '<span class="text-green-600 text-xs font-semibold">✓ Completed</span>' : ''}
        </div>
        <h3 class="font-bold text-base mb-2">Halkokari Skirmish Monument</h3>
        <p class="text-sm text-gray-600 mb-3">Find the memorial/park marker dedicated to the battle. What year did this clash take place?</p>
      </div>
    `;

    location2Marker.bindPopup(location2PopupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    locationMarkersRef.current.set('location_2', location2Marker);

    // Add other locations from backend if available
    if (locations && Array.isArray(locations)) {
      locations.forEach((location: PublicLocationInfo) => {
        // Skip if this is location 1 or 2 (already added)
        const seqNum = Number(location.sequenceNumber);
        if (seqNum === 1 || seqNum === 2) return;

        const isCompleted = completedIds.has(seqNum);
        
        const iconHtml = `
          <div class="relative">
            <div class="absolute -inset-2 bg-primary/20 rounded-full animate-pulse"></div>
            <div class="relative flex items-center justify-center">
              <img src="/assets/generated/location-marker.dim_32x32.png" alt="Location" class="w-10 h-10 drop-shadow-lg ${isCompleted ? 'opacity-100' : 'opacity-70'}" />
              <span class="absolute text-white font-bold text-xs drop-shadow-md">${seqNum}</span>
            </div>
            ${isCompleted ? '<img src="/assets/generated/completed-check.dim_24x24.png" alt="Completed" class="absolute -top-1 -right-1 w-5 h-5 drop-shadow-lg" />' : ''}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([location.coordinates.latitude, location.coordinates.longitude], {
          icon: customIcon,
        }).addTo(mapInstanceRef.current);

        const popupContent = `
          <div class="p-3 min-w-[220px]">
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Location ${seqNum}
              </span>
              ${isCompleted ? '<span class="text-green-600 text-xs font-semibold">✓ Completed</span>' : ''}
            </div>
            <h3 class="font-bold text-base mb-2">${location.title}</h3>
            <p class="text-sm text-gray-600 mb-3">Discover this location by scanning its QR code</p>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });
        locationMarkersRef.current.set(location.id, marker);
      });
    }
  }, [mapLoaded, locations, userProgress, leafletLoaded]);

  // Track user location
  useEffect(() => {
    if (!isTracking || !mapLoaded || !leafletLoaded) return;

    const L = window.L;
    let watchId: number;

    const updateUserLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      setUserLocation({ lat: latitude, lng: longitude });
      setLocationError(null);

      if (mapInstanceRef.current) {
        // Update or create user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const userIconHtml = `
            <div class="relative">
              <div class="absolute -inset-3 bg-blue-500/30 rounded-full animate-ping"></div>
              <div class="relative w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg"></div>
            </div>
          `;

          const userIcon = L.divIcon({
            html: userIconHtml,
            className: 'user-location-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: userIcon,
          }).addTo(mapInstanceRef.current);

          userMarkerRef.current.bindPopup('<div class="text-center p-2"><strong>You are here</strong></div>');
        }

        // Center map on user location
        mapInstanceRef.current.setView([latitude, longitude], 15);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      let message = 'Unable to get your location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission denied. Please enable location access.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out.';
          break;
      }
      setLocationError(message);
      setIsTracking(false);
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(updateUserLocation, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    } else {
      setLocationError('Geolocation is not supported by your browser');
      setIsTracking(false);
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, mapLoaded, leafletLoaded]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (isTracking && userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
      setUserLocation(null);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  };

  if (!leafletLoaded) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map Controls - Compact for mobile */}
      <div className="p-3 space-y-2" style={{ flex: '0 0 auto' }}>
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-4 w-4 text-primary" />
              Interactive Map
            </CardTitle>
            <CardDescription className="text-xs">
              Explore story locations in Kokkola
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="flex gap-2">
              <Button
                onClick={toggleTracking}
                variant={isTracking ? 'default' : 'outline'}
                className="flex-1 h-10 text-sm"
                size="sm"
              >
                <Navigation className="mr-2 h-4 w-4" />
                {isTracking ? 'Stop' : 'Track'}
              </Button>
              {userLocation && (
                <Button
                  onClick={centerOnUser}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                >
                  <Locate className="h-4 w-4" />
                </Button>
              )}
            </div>

            {locationError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">{locationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Container - Maximized space */}
      <div className="flex-1 relative px-3 pb-3">
        <div 
          ref={mapRef} 
          className="absolute inset-x-3 top-0 bottom-3 rounded-lg overflow-hidden border-2 border-primary/20 shadow-xl"
          style={{ minHeight: '300px' }}
        />
        {locationsLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center mx-3 mb-3">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-foreground">Loading locations...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend - Compact */}
      <div className="px-3 pb-3" style={{ flex: '0 0 auto' }}>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="flex items-center justify-around text-xs gap-2">
              <div className="flex items-center gap-1.5">
                <img src="/assets/generated/location-marker.dim_32x32.png" alt="Undiscovered" className="w-5 h-5 opacity-70" />
                <span className="text-muted-foreground">New</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img src="/assets/generated/location-marker.dim_32x32.png" alt="Completed" className="w-5 h-5" />
                <span className="text-muted-foreground">Done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-muted-foreground">You</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

