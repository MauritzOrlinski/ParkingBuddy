import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const initialZoom = 12;

const hiddenMapStyle = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
];

// Choose marker color based on waiting time
const getMarkerIcon = (waitingTime) => {
  let minutes = parseInt(waitingTime, 10);
  if (Number.isNaN(minutes)) minutes = null;

  let fill = "#22c55e"; // green default
  if (minutes == null) {
    fill = "#9ca3af"; // gray for N/A
  } else if (minutes >= 15 && minutes < 30) {
    fill = "#f97316"; // orange
  } else if (minutes >= 30) {
    fill = "#ef4444"; // red
  }

  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: "#0f172a",
    strokeWeight: 1,
    scale: 1.3,
  };
};

// Reusable info layout
const MarkerInfoContent = ({ location }) => (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
      maxWidth: "260px",
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
);

function MapComponent({
  apiKey,
  locations = [],
  center: propCenter,
  zoom: propZoom,
  userLocation,
  destination,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [activeMarker, setActiveMarker] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedParking, setSelectedParking] = useState(null);
  const [directionsCar, setDirectionsCar] = useState(null);
  const [directionsWalk, setDirectionsWalk] = useState(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkSize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleMarkerClick = useCallback((location) => {
    setActiveMarker(location);
    setSelectedParking(location);
    setDirectionsCar(null);
    setDirectionsWalk(null);
  }, []);

  const handleCloseClick = useCallback(() => {
    setActiveMarker(null);
    setSelectedParking(null);
    setDirectionsCar(null);
    setDirectionsWalk(null);
  }, []);

  const center = useMemo(() => {
    if (
      propCenter &&
      typeof propCenter.lat === "number" &&
      typeof propCenter.lng === "number"
    ) {
      return { lat: propCenter.lat, lng: propCenter.lng };
    }
    if (locations && locations.length > 0) {
      return { lat: locations[0].lat, lng: locations[0].lng };
    }
    return { lat: 48.13513, lng: 11.58198 };
  }, [propCenter, locations]);

  const effectiveZoom =
    typeof propZoom === "number" && !Number.isNaN(propZoom)
      ? propZoom
      : initialZoom;

  if (loadError) return <div>Map Load Error: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  const canRoute =
    !!userLocation &&
    !!destination &&
    !!selectedParking &&
    typeof userLocation.lat === "number" &&
    typeof destination.lat === "number";

  return (
    <>
      <GoogleMap
        key={`${center.lat}-${center.lng}-${effectiveZoom}`}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={effectiveZoom}
        options={{
          styles: hiddenMapStyle,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {/* Car route: user → parking */}
        {canRoute && !directionsCar && (
          <DirectionsService
            options={{
              origin: userLocation,
              destination: {
                lat: selectedParking.lat,
                lng: selectedParking.lng,
              },
              travelMode: window.google.maps.TravelMode.DRIVING,
            }}
            callback={(res) => {
              if (!res || res.status !== "OK") return;
              setDirectionsCar(res);
            }}
          />
        )}

        {/* Walk route: parking → destination */}
        {canRoute && !directionsWalk && (
          <DirectionsService
            options={{
              origin: {
                lat: selectedParking.lat,
                lng: selectedParking.lng,
              },
              destination: destination,
              travelMode: window.google.maps.TravelMode.WALKING,
            }}
            callback={(res) => {
              if (!res || res.status !== "OK") return;
              setDirectionsWalk(res);
            }}
          />
        )}

        {directionsCar && (
          <DirectionsRenderer
            directions={directionsCar}
            options={{
              polylineOptions: {
                strokeOpacity: 0.9,
                strokeWeight: 5,
              },
            }}
          />
        )}

        {directionsWalk && (
          <DirectionsRenderer
            directions={directionsWalk}
            options={{
              polylineOptions: {
                strokeOpacity: 0.9,
                strokeWeight: 4,
                strokeDasharray: [10, 10],
              },
            }}
          />
        )}

        {/* Parking markers */}
        {locations.map((location, index) => (
          <Marker
            key={index}
            position={{ lat: location.lat, lng: location.lng }}
            onClick={() => handleMarkerClick(location)}
            icon={{
              ...getMarkerIcon(location.waitingTime),
              anchor: new window.google.maps.Point(12, 24),
              labelOrigin: new window.google.maps.Point(12, -6),
            }}
            label={{
              text: `${parseInt(location.waitingTime, 10)}m`,
              color: "#0f172a",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            {/* Desktop / tablet: normal InfoWindow */}
            {!isMobile && activeMarker && activeMarker === location && (
              <InfoWindow
                position={{ lat: location.lat, lng: location.lng }}
                onCloseClick={handleCloseClick}
              >
                <MarkerInfoContent location={location} />
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Optional: marker for user and destination */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}
        {destination && (
          <Marker
            position={destination}
            icon={{
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>

      {/* Phone-sized: bottom sheet instead of InfoWindow */}
      {isMobile && activeMarker && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backgroundColor: "white",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            boxShadow: "0 -10px 30px rgba(15, 23, 42, 0.25)",
            padding: "12px 16px 18px",
            maxHeight: "40vh",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              margin: "0 auto 8px",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
                fontWeight: 600,
              }}
            >
              Parking details
            </span>
            <button
              onClick={handleCloseClick}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px",
                margin: 0,
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1,
                color: "#6b7280",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <MarkerInfoContent location={activeMarker} />
        </div>
      )}
    </>
  );
}

export default MapComponent;
