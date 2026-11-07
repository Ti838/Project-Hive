'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  campus: string | null;
  accuracyMeters: number | null;
  isDetecting: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  error: string | null;
}

export function useLocationIntelligence() {
  const { user, updateUser } = useAuthStore();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: user?.city || null,
    country: user?.country || null,
    campus: user?.university || null,
    accuracyMeters: null,
    isDetecting: false,
    permissionStatus: 'prompt',
    error: null,
  });

  // Query browser permission state if supported
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions) return;

    navigator.permissions.query({ name: 'geolocation' as PermissionName })
      .then((perm) => {
        setState((prev) => ({
          ...prev,
          permissionStatus: perm.state as 'prompt' | 'granted' | 'denied',
        }));
        perm.onchange = () => {
          setState((prev) => ({
            ...prev,
            permissionStatus: perm.state as 'prompt' | 'granted' | 'denied',
          }));
        };
      })
      .catch(() => {
        // Permissions API unsupported on older browser
      });
  }, []);

  /**
   * Prompts user with pre-consent explanation, then requests browser GPS
   */
  const requestLocationWithConsent = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        permissionStatus: 'unsupported',
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    // Trigger pre-consent modal to satisfy Rule 6.2
    setShowConsentModal(true);
  }, []);

  /**
   * Executes the actual browser geolocation call upon user affirmative consent
   */
  const confirmAndDetectLocation = useCallback(() => {
    setShowConsentModal(false);
    setState((prev) => ({ ...prev, isDetecting: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Approximate city reverse-geocoding via free public OpenStreetMap Nominatim
        let detectedCity: string | null = null;
        let detectedCountry: string | null = null;

        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { signal: AbortSignal.timeout(4000), headers: { 'Accept-Language': 'en' } }
          );
          if (geoRes.ok) {
            const data = await geoRes.json();
            detectedCity = data.address?.city || data.address?.town || data.address?.county || null;
            detectedCountry = data.address?.country || null;
          }
        } catch (_) {
          // Gracefully continue without reverse geocode
        }

        setState((prev) => ({
          ...prev,
          latitude,
          longitude,
          city: detectedCity,
          country: detectedCountry,
          accuracyMeters: Math.round(accuracy),
          isDetecting: false,
          permissionStatus: 'granted',
          error: null,
        }));

        // Persist to user profile
        try {
          const updatePayload: Record<string, any> = {
            location_lat: latitude,
            location_lng: longitude,
          };
          if (detectedCity) updatePayload.location_city = detectedCity;
          if (detectedCountry) updatePayload.location_country = detectedCountry;

          const res = await api.users.update(updatePayload as any);
          if (res?.user) updateUser(res.user);
        } catch (err) {
          console.warn('[Location] Failed to persist location to profile:', err);
        }
      },
      (err) => {
        let msg = 'Failed to retrieve location.';
        if (err.code === 1) msg = 'Location access was denied.';
        else if (err.code === 2) msg = 'Location position is unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';

        setState((prev) => ({
          ...prev,
          isDetecting: false,
          permissionStatus: err.code === 1 ? 'denied' : prev.permissionStatus,
          error: msg,
        }));
      },
      {
        enableHighAccuracy: false, // Low battery consumption
        timeout: 10000,
        maximumAge: 600000, // 10 minutes cache
      }
    );
  }, [updateUser]);

  const setManualCampus = useCallback(async (campus: string, city?: string) => {
    setState((prev) => ({
      ...prev,
      campus,
      city: city || prev.city,
    }));

    try {
      const res = await api.users.update({
        university: campus,
        ...(city ? { location_city: city } : {}),
      } as any);
      if (res?.user) updateUser(res.user);
    } catch (err) {
      console.warn('[Location] Failed to save manual campus:', err);
    }
  }, [updateUser]);

  return {
    ...state,
    showConsentModal,
    setShowConsentModal,
    requestLocationWithConsent,
    confirmAndDetectLocation,
    setManualCampus,
  };
}

