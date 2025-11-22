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
  height: "400px",
  margin: "20px 0",
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
  // Convert the string time to a numeric value for comparison
  const timeValue = parseInt(waitingTime);
  let pinColor;

  if (timeValue <= 5) {
    pinColor = "#4CAF50"; // Green for short wait
  } else if (timeValue <= 15) {
    pinColor = "#FFC107"; // Yellow for medium wait
  } else {
    pinColor = "#F44336"; // Red for long wait
  }

  // This returns a standard Google Maps Icon Object
  return {
    path: window.google.maps.SymbolPath.CIRCLE, // Use a simple circle shape
    fillColor: pinColor,
    fillOpacity: 0.9,
    strokeWeight: 1,
    scale: 10,
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
          icon={getMarkerIcon(location.waitingTime)}
          label={{
            text: `${location.waitingTime}`,
            color: "black",
            fontWeight: "bold",
            fontSize: "14px",
            lineHeight: "20px",
          }}
        >
          {activeMarker === location && (
            <InfoWindow
              position={{ lat: location.lat, lng: location.lng }}
              onCloseClick={handleCloseClick}
            >
              <div style={{ padding: "5px" }}>
                <h3>{location.label || "Location"}</h3>
                <p>**Waiting Time:** **{location.waitingTime || "N/A"}**</p>
                <p>
                  <small>
                    ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})
                  </small>
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
