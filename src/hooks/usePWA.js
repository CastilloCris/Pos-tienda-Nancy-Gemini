/**
 * usePWA — Hook central para gestión de la PWA
 * Maneja: detección de instalación, estado standalone, actualizaciones y caché offline.
 */
import { useEffect, useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePWA() {
  // Estado de instalación
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detectar si ya está corriendo como app standalone instalada
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isLocalDev =
    import.meta.env.DEV ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Hook de vite-plugin-pwa para manejo de actualizaciones y caché offline
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: !isLocalDev,
    onRegistered(r) {
      if (!isLocalDev) {
        console.log("[PWA] Service worker registrado:", r);
      }
    },
    onRegisterError(error) {
      if (!isLocalDev) {
        console.warn("[PWA] Error al registrar service worker:", error);
      }
    },
  });

  useEffect(() => {
    if (!isLocalDev || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then((results) => {
        if (results.some(Boolean)) {
          console.warn("[PWA] Service workers desregistrados en localhost para evitar interferencias con Supabase.");
        }
      })
      .catch((error) => {
        console.warn("[PWA] No se pudieron desregistrar service workers en localhost:", error);
      });
  }, [isLocalDev]);

  // Escuchar el evento beforeinstallprompt (solo Chrome/Edge en Android/PC)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Evitar el mini-infobar automático
      setInstallPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detectar si el usuario completó la instalación
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  // Disparar el prompt de instalación del sistema operativo
  const triggerInstall = useCallback(async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    }
  }, [installPromptEvent]);

  // Cerrar el banner de "offline ready"
  const dismissOfflineReady = useCallback(() => setOfflineReady(false), [setOfflineReady]);

  // Actualizar el service worker — el usuario lo controla, nunca forzado
  const applyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  // Descartar el banner de update sin actualizar
  const dismissUpdate = useCallback(() => setNeedRefresh(false), [setNeedRefresh]);

  return {
    // Instalación
    canInstall: !!installPromptEvent && !isInstalled && !isStandalone,
    isInstalled: isInstalled || isStandalone,
    triggerInstall,

    // Actualizaciones
    needRefresh: isLocalDev ? false : needRefresh,
    applyUpdate,
    dismissUpdate,

    // Caché offline listo
    offlineReady: isLocalDev ? false : offlineReady,
    dismissOfflineReady,
  };
}
