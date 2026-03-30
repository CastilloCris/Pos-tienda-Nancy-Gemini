import { useEffect, useState } from "react";

export function usePrintManager(carrito) {
  const [printMode, setPrintMode] = useState(null);
  const [labelsToPrint, setLabelsToPrint] = useState([]);
  const [boxReportToPrint, setBoxReportToPrint] = useState(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode(null);
      setLabelsToPrint([]);
      setBoxReportToPrint(null);
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  useEffect(() => {
    if (printMode === "ticket" && carrito.length) {
      const timeoutId = window.setTimeout(() => window.print(), 80);
      return () => window.clearTimeout(timeoutId);
    }
    if (printMode === "labels" && labelsToPrint.length) {
      const timeoutId = window.setTimeout(() => window.print(), 80);
      return () => window.clearTimeout(timeoutId);
    }
    if (printMode === "box-report" && boxReportToPrint) {
      const timeoutId = window.setTimeout(() => window.print(), 80);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [boxReportToPrint, carrito.length, labelsToPrint, printMode]);

  return {
    printMode,
    setPrintMode,
    labelsToPrint,
    setLabelsToPrint,
    boxReportToPrint,
    setBoxReportToPrint,
  };
}
