import { useEffect, useRef } from "react";
import { db } from "../db";
import { talles } from "../utils/helpers";

const QR_FORMATS = ["CODE_128", "EAN_13", "EAN_8", "UPC_A", "UPC_E", "CODE_39"];
const BACK_CAMERA_LABEL = /(back|rear|environment|trasera|traseira)/i;

const normalizeBarcode = (value) => String(value ?? "").trim().replace(/\s+/g, "");

const getProductBarcodeCandidates = (producto) =>
  [producto?.codigo, producto?.sku, producto?.codigoBarra, producto?.barcode, producto?.id]
    .map((value) => normalizeBarcode(value))
    .filter(Boolean);

const loadHtml5QrcodeModule = async () => {
  const module = await import("html5-qrcode");
  return {
    Html5Qrcode: module.Html5Qrcode,
    formatsToSupport: QR_FORMATS.map((formatKey) => module.Html5QrcodeSupportedFormats[formatKey]).filter(Boolean),
  };
};

export function useBarcodeScanner({
  tab,
  cameraOpen,
  setCameraOpen,
  setCameraError,
  setCameraLoading,
  setScannerCodigo,
  setMensaje,
  setLastDetectedCode,
  addToCart,
  scannerRef,
}) {
  const audioRef = useRef(null);
  const bufferRef = useRef("");
  const timeoutRef = useRef(null);
  const cameraScannerRef = useRef(null);
  const isScanning = useRef(true);
  const cameraProcessingRef = useRef(false);
  const cameraRetryTimeoutRef = useRef(null);
  const cameraCooldownTimeoutRef = useRef(null);
  const lastAcceptedCameraCodeRef = useRef("");
  const cameraInitPromiseRef = useRef(null);
  const cameraContainerId = "camera-barcode-reader";

  const playBeep = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 600;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  };

  const findByCode = async (code) => {
    const lookup = async (value) => {
      console.log('[sales-flow] findByCode using db.productos.where("codigo").equals(...)', { value });
      const totalProductos = await db.productos.count();
      console.log("[sales-flow] findByCode inventory status", { totalProductos });
      const exact = await db.productos.where("codigo").equals(String(value)).first();
      if (exact) {
        console.log("[sales-flow] findByCode exact match found", {
          productoId: exact.id,
          codigo: exact.codigo,
          nombre: exact.nombre,
        });
        return exact;
      }
      const all = await db.productos.toArray();
      const fallback = all.find((producto) => getProductBarcodeCandidates(producto).includes(value)) || null;
      console.log("[sales-flow] findByCode fallback search result", {
        found: Boolean(fallback),
        productoId: fallback?.id ?? null,
        codigo: fallback?.codigo ?? null,
        totalProductos: all.length,
        sampleCodes: all.slice(0, 10).map((producto) => ({
          id: producto.id,
          codigo: producto.codigo ?? null,
          nombre: producto.nombre ?? "",
        })),
      });
      return fallback;
    };

    try {
      const value = normalizeBarcode(code);
      console.log("[scanner] findByCode input:", code, "normalized:", value);
      if (!value) return null;
      return await lookup(value);
    } catch (error) {
      console.error("Error al buscar producto por codigo en Dexie (intento 1):", error);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      try {
        const retryValue = normalizeBarcode(code);
        if (!retryValue) return null;
        return await lookup(retryValue);
      } catch (retryError) {
        console.error("Error al buscar producto por codigo en Dexie (reintento):", retryError);
        return null;
      }
    }
  };

  const processCode = async (code) => {
    console.log("[scanner] processCode called with:", code);
    const producto = await findByCode(code);
    if (!producto) {
      console.warn("[scanner] product not found for code:", code);
      setMensaje(`No se encontro ningun producto con el codigo ${code}.`);
      setScannerCodigo("");
      return null;
    }

    console.log("[sales-flow] processCode product found, sending to addToCart", {
      productoId: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo ?? "",
    });
    addToCart(producto, talles(producto.talles)[0] || "Unico");
    setScannerCodigo("");
    scannerRef.current?.focus();
    console.log("[sales-flow] processCode completed", {
      productoId: producto.id,
      scannerCodigoCleared: true,
    });
    return producto;
  };

  const handleCameraScanSuccess = async (decodedText, decodedResult) => {
    if (!isScanning.current || cameraProcessingRef.current) return;

    const code = String(decodedText || "").trim();
    const formatName = decodedResult?.result?.format?.formatName || decodedResult?.result?.format || "unknown";
    setLastDetectedCode(`${code} (${formatName})`);
    console.log("[scanner] code detected:", { code, formatName, decodedResult });

    if (!code) return;
    if (lastAcceptedCameraCodeRef.current === code) {
      console.log("[scanner] duplicated camera read ignored", { code, formatName });
      return;
    }

    cameraProcessingRef.current = true;
    isScanning.current = false;

    if (cameraCooldownTimeoutRef.current) {
      window.clearTimeout(cameraCooldownTimeoutRef.current);
    }

    cameraCooldownTimeoutRef.current = window.setTimeout(() => {
      isScanning.current = true;
      cameraCooldownTimeoutRef.current = null;
      lastAcceptedCameraCodeRef.current = ""; // Limpiar para permitir escanear el mismo item de nuevo
    }, 2500); // 2.5 segundos de espera antes de poder escanear EXACTAMENTE el mismo codigo de nuevo

    try {
      console.log("[scanner] calling processCode from camera with:", code);
      const producto = await processCode(code);
      if (!producto) {
        console.warn("[scanner] camera read not found in inventory", { code, formatName });
        setMensaje(`El codigo ${code} no existe en el inventario.`);
        return;
      }
      lastAcceptedCameraCodeRef.current = code;
      playBeep();
      setMensaje(`Producto: ${producto.nombre} agregado`);
    } finally {
      cameraProcessingRef.current = false;
    }
  };

  const handleCameraScanFailure = () => {
    if (cameraRetryTimeoutRef.current) return;
    cameraRetryTimeoutRef.current = window.setTimeout(() => {
      cameraRetryTimeoutRef.current = null;
    }, 200);
  };

  const stopCameraScanner = async () => {
    if (cameraInitPromiseRef.current) {
      try {
        await cameraInitPromiseRef.current;
      } catch {}
      cameraInitPromiseRef.current = null;
    }

    const scanner = cameraScannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch (e) {
      console.warn("[scanner] error while stopping safely:", e?.message || e);
    }

    if (cameraRetryTimeoutRef.current) {
      window.clearTimeout(cameraRetryTimeoutRef.current);
      cameraRetryTimeoutRef.current = null;
    }
    if (cameraCooldownTimeoutRef.current) {
      window.clearTimeout(cameraCooldownTimeoutRef.current);
      cameraCooldownTimeoutRef.current = null;
    }

    cameraScannerRef.current = null;
    isScanning.current = true;
    cameraProcessingRef.current = false;
    lastAcceptedCameraCodeRef.current = "";
    setCameraLoading(false);
  };

  const closeCameraScanner = () => {
    setCameraOpen(false);
  };

  useEffect(() => {
    if (tab === "ventas") {
      window.setTimeout(() => scannerRef.current?.focus(), 50);
    }
  }, [tab, scannerRef]);

  useEffect(() => {
    if (tab !== "ventas") return undefined;

    const editable = (element) => element && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));
    const clean = () => {
      bufferRef.current = "";
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const onKey = (event) => {
      if (editable(event.target)) {
        return;
      }
      if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;

      if (event.key === "Enter") {
        const code = bufferRef.current.trim();
        console.log("[sales-flow] scanner submit", {
          bufferedCode: bufferRef.current,
          trimmedCode: code,
        });
        if (code.length >= 3) {
          event.preventDefault();
          processCode(code);
        }
        clean();
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
        console.log("[sales-flow] keyboard scanner buffer update", {
          key: event.key,
          buffer: bufferRef.current,
        });
        setScannerCodigo(bufferRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          console.log("[sales-flow] keyboard scanner buffer timeout clear");
          clean();
          setScannerCodigo("");
        }, 250);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clean();
    };
  }, [tab, scannerRef, setScannerCodigo]);

  useEffect(() => {
    if (tab !== "ventas" && cameraOpen) {
      closeCameraScanner();
    }
  }, [tab, cameraOpen]);

  useEffect(() => {
    if (!cameraOpen || tab !== "ventas") return undefined;

    let cancelled = false;

    const startCameraScanner = async () => {
      setCameraError("");
      setCameraLoading(true);

      try {
        const hostname = window.location.hostname;
        const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
        if (!window.isSecureContext && !isLocalHost) {
          setCameraError("La camara del celular requiere HTTPS o localhost. Abre la app con una URL segura.");
          setCameraLoading(false);
          return;
        }

        if (!document.getElementById(cameraContainerId)) {
          setCameraLoading(false);
          return;
        }

        const { Html5Qrcode, formatsToSupport } = await loadHtml5QrcodeModule();
        if (cameraScannerRef.current) {
          await stopCameraScanner();
        }

        const scanner = new Html5Qrcode(cameraContainerId);
        cameraScannerRef.current = scanner;
        const scannerConfig = {
          fps: 12,
          // Caja ligeramente mas alta y ancha para facilitar el enfoque sin congelar la imagen.
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.floor(viewfinderWidth * 0.8),
            height: Math.floor(viewfinderHeight * 0.4),
          }),
          formatsToSupport,
          // ZXing suele ser mas estable que BarcodeDetector para CODE128 impresos.
          experimentalFeatures: { useBarCodeDetectorIfSupported: false },
          disableFlip: false,
        };

        const cameras = typeof Html5Qrcode.getCameras === "function" ? await Html5Qrcode.getCameras() : [];
        const preferredCamera = cameras.find((camera) => BACK_CAMERA_LABEL.test(camera.label || "")) || cameras[0] || null;
        console.log("[scanner] starting camera", {
          preferredCameraId: preferredCamera?.id || null,
          preferredCameraLabel: preferredCamera?.label || null,
          formats: QR_FORMATS,
        });

        if (preferredCamera?.id) {
          cameraInitPromiseRef.current = scanner.start(preferredCamera.id, scannerConfig, handleCameraScanSuccess, handleCameraScanFailure);
          await cameraInitPromiseRef.current;
        } else {
          cameraInitPromiseRef.current = scanner.start({ facingMode: "environment" }, scannerConfig, handleCameraScanSuccess, handleCameraScanFailure);
          await cameraInitPromiseRef.current;
        }
      } catch {
        try {
          const { Html5Qrcode, formatsToSupport } = await loadHtml5QrcodeModule();
          if (cameraScannerRef.current) {
            await stopCameraScanner();
          }
          if (cancelled) return;
          const scanner = new Html5Qrcode(cameraContainerId);
          cameraScannerRef.current = scanner;
          const scannerConfig = {
            fps: 12,
            // Fallback con region igual de indulgente.
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.floor(viewfinderWidth * 0.8),
              height: Math.floor(viewfinderHeight * 0.4),
            }),
            formatsToSupport,
            experimentalFeatures: { useBarCodeDetectorIfSupported: false },
            disableFlip: false,
          };
          console.log("[scanner] fallback camera start using facingMode:user");
          cameraInitPromiseRef.current = scanner.start({ facingMode: "user" }, scannerConfig, handleCameraScanSuccess, handleCameraScanFailure);
          await cameraInitPromiseRef.current;
        } catch {
          if (!cancelled) {
            setCameraError("No se pudo acceder a la camara. Revisa permisos del navegador, HTTPS y que el celular use la camara trasera.");
          }
          await stopCameraScanner();
        }
      } finally {
        if (!cancelled) {
          setCameraLoading(false);
        }
        cameraInitPromiseRef.current = null;
      }
    };

    startCameraScanner();

    return () => {
      cancelled = true;
      console.log("[scanner] stopping camera");
      stopCameraScanner();
    };
  }, [cameraOpen, tab]);

  return {
    cameraContainerId,
    processCode,
    closeCameraScanner,
  };
}
