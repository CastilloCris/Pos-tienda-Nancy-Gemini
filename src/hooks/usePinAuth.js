import { useEffect, useState } from "react";
import { AUTH_STORAGE_KEY, getEndOfDayTimestamp, getTodayKey, PIN_CODE } from "../utils/helpers";

export function usePinAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (!session?.expiresAt || Number(session.expiresAt) <= Date.now() || session?.fechaClave !== getTodayKey()) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!pinShake) return undefined;
    const timeoutId = window.setTimeout(() => setPinShake(false), 450);
    return () => window.clearTimeout(timeoutId);
  }, [pinShake]);

  useEffect(() => {
    if (isAuthenticated) return undefined;

    const onKeyDown = (event) => {
      if (/^\d$/.test(event.key)) {
        setPinInput((current) => {
          if (current.length >= PIN_CODE.length) return current;
          return `${current}${event.key}`;
        });
        if (pinError) setPinError("");
        if (pinShake) setPinShake(false);
        return;
      }

      if (event.key === "Backspace") {
        setPinInput((current) => current.slice(0, -1));
        if (pinError) setPinError("");
        if (pinShake) setPinShake(false);
      }

      if (event.key === "Escape") {
        setPinInput("");
        if (pinError) setPinError("");
        if (pinShake) setPinShake(false);
      }

      if (event.key === "Enter" && pinInput.length === PIN_CODE.length) {
        event.preventDefault();
        if (pinInput === PIN_CODE) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ fechaClave: getTodayKey(), expiresAt: getEndOfDayTimestamp() }));
          setIsAuthenticated(true);
          setPinInput("");
          setPinError("");
          setPinShake(false);
        } else {
          setPinError("PIN incorrecto. Intenta nuevamente.");
          setPinShake(true);
          setPinInput("");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthenticated, pinError, pinInput, pinShake]);

  const authenticateWithPin = (candidate) => {
    if (candidate === PIN_CODE) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ fechaClave: getTodayKey(), expiresAt: getEndOfDayTimestamp() }));
      setIsAuthenticated(true);
      setPinInput("");
      setPinError("");
      setPinShake(false);
      return true;
    }

    setPinError("PIN incorrecto. Intenta nuevamente.");
    setPinShake(true);
    setPinInput("");
    return false;
  };

  const handlePinSubmit = (event) => {
    event.preventDefault();
    if (pinInput.length !== PIN_CODE.length) {
      setPinError(`Ingresa los ${PIN_CODE.length} digitos del PIN.`);
      setPinShake(true);
      return;
    }
    authenticateWithPin(pinInput);
  };

  const handlePinDigit = (digit) => {
    setPinInput((current) => {
      if (current.length >= PIN_CODE.length) return current;
      const next = `${current}${digit}`;
      if (pinError) setPinError("");
      if (pinShake) setPinShake(false);
      if (next.length === PIN_CODE.length) {
        window.setTimeout(() => authenticateWithPin(next), 80);
      }
      return next;
    });
  };

  const handlePinBackspace = () => {
    setPinInput((current) => current.slice(0, -1));
    if (pinError) setPinError("");
    if (pinShake) setPinShake(false);
  };

  const handlePinClear = () => {
    setPinInput("");
    if (pinError) setPinError("");
    if (pinShake) setPinShake(false);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPinInput("");
    setPinError("");
    setPinShake(false);
  };

  return {
    isAuthenticated,
    pinInput,
    pinError,
    pinShake,
    handlePinSubmit,
    handlePinDigit,
    handlePinBackspace,
    handlePinClear,
    logout,
  };
}
