import React, { useState, useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const initialZoom = 12;
// 1. Define the style array to hide default Google Maps elements
const hiddenMapStyle = [
  {
    featureType: "poi", // Points of Interest (stores, parks, schools, etc.)
    stylers: [
      { visibility: "off" }, // Hide them entirely
    ],
  },
  {
    featureType: "transit", // Transit stations and lines
    elementType: "labels", // Hide the labels (names)
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road", // Roads and their labels
    elementType: "geometry.stroke", // Road outlines
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.local", // Local roads
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    // To make the map look very clean, you can also tone down or hide labels for major roads
    featureType: "road.highway",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality", // City/Town labels
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];
// --- Helper Function for Customizing the Marker Icon ---
const getMarkerIcon = (waitingTime) => {
  const timeValue = parseInt(waitingTime, 10);
  let pinColor;
  let pinBorder;

  if (timeValue <= 5) {
    pinColor = "#22c55e"; // green
    pinBorder = "#16a34a";
  } else if (timeValue <= 15) {
    pinColor = "#facc15"; // yellow
    pinBorder = "#eab308";
  } else {
    pinColor = "#f97373"; // soft red
    pinBorder = "#ef4444";
  }

  // Modern, rounded pin shape (SVG path)
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: pinColor,
    fillOpacity: 1,
    strokeColor: pinBorder,
    strokeWeight: 1.5,
    scale: 1.4,
    anchor: new window.google.maps.Point(12, 22), // bottom tip of the pin
  };
};


function MapComponent({ apiKey, locations = [] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [activeMarker, setActiveMarker] = useState(null);

  const handleMarkerClick = useCallback((location) => {
    setActiveMarker(location);
  }, []);

  const handleCloseClick = useCallback(() => {
    setActiveMarker(null);
  }, []);

  const center = useMemo(() => {
    if (locations && locations.length > 0) {
      return { lat: locations[0].lat, lng: locations[0].lng };
    }
    return { lat: 48.13513, lng: 11.58198 }; // Fallback (Munich)
  }, [locations]);

  if (loadError) return <div>Map Load Error: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={initialZoom}
      options={{
        styles: hiddenMapStyle,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      }}
    >
      {locations.map((location, index) => (
        <Marker
        key={index}
        position={{ lat: location.lat, lng: location.lng }}
        onClick={() => handleMarkerClick(location)}
        icon={{
          ...getMarkerIcon(location.waitingTime),
          // move anchor to bottom tip of the pin
          anchor: new window.google.maps.Point(12, 24),
          // define the origin where labels should be centered ABOVE the pin
          labelOrigin: new window.google.maps.Point(12, -6),
        }}
        label={{
          text: `${parseInt(location.waitingTime, 10)}m`,
          color: "#0f172a",
          fontWeight: "700",
          fontSize: "13px",
        }}
      >
      
          {activeMarker === location && (
            <InfoWindow
              position={{ lat: location.lat, lng: location.lng }}
              onCloseClick={handleCloseClick}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
                  maxWidth: "220px",
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {location.label || "Parking spot"}
                  </h3>

                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: "#e5f0ff",
                      color: "#1d4ed8",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {location.waitingTime || "N/A"}
                  </span>
                </div>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Coordinates:</span>{" "}
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
}

export default MapComponent;
