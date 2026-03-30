import { Download, RefreshCw, WifiOff, CheckCircle, X } from "lucide-react";
import { usePWA } from "../hooks/usePWA";

/**
 * PWABanners — Contenedor de todos los banners de la PWA.
 * Montar este componente al nivel raíz del layout autenticado.
 * Cada banner aparece solo cuando corresponde y no molesta al usuario innecesariamente.
 */
export function PWABanners() {
  const {
    canInstall,
    triggerInstall,
    needRefresh,
    applyUpdate,
    dismissUpdate,
    offlineReady,
    dismissOfflineReady,
  } = usePWA();

  return (
    <div className="space-y-2 print:hidden">
      {/* Banner de instalación: Solo aparece si el navegador lo soporta y la app no está instalada */}
      {canInstall && (
        <InstallBanner onInstall={triggerInstall} />
      )}

      {/* Banner de nueva versión disponible */}
      {needRefresh && (
        <UpdateBanner onUpdate={applyUpdate} onDismiss={dismissUpdate} />
      )}

      {/* Banner de "offline ready" — aparece la primera vez que el caché está listo */}
      {offlineReady && !needRefresh && (
        <OfflineReadyBanner onDismiss={dismissOfflineReady} />
      )}
    </div>
  );
}

/**
 * Banner de instalación de la PWA
 */
function InstallBanner({ onInstall }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <Download size={16} className="shrink-0 text-indigo-400" />
        <p className="text-indigo-200 font-medium">
          Instalá Tienda Nancy como app en tu dispositivo para usarla sin el navegador.
        </p>
      </div>
      <button
        onClick={onInstall}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/20 px-4 py-2 font-semibold text-indigo-200 transition hover:bg-indigo-500/30"
      >
        <Download size={14} />
        Instalar app
      </button>
    </div>
  );
}

/**
 * Banner de actualización disponible
 */
function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <RefreshCw size={16} className="shrink-0 text-amber-400" />
        <p className="text-amber-200 font-medium">
          Hay una nueva versión de Tienda Nancy disponible.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onUpdate}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2 font-semibold text-amber-200 transition hover:bg-amber-500/30"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
        <button
          onClick={onDismiss}
          aria-label="Cerrar"
          className="rounded-xl p-2 text-amber-400/60 transition hover:bg-amber-500/10 hover:text-amber-200"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Banner de confirmación: la app está lista para usarse offline
 */
function OfflineReadyBanner({ onDismiss }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <CheckCircle size={16} className="shrink-0 text-emerald-400" />
        <p className="text-emerald-200 font-medium">
          App lista para funcionar sin internet.
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Cerrar"
        className="rounded-xl p-2 text-emerald-400/60 transition hover:bg-emerald-500/10 hover:text-emerald-200"
      >
        <X size={14} />
      </button>
    </div>
  );
}
