import { useState, useEffect, useCallback } from "react";

/**
 * Hook to detect and handle USB barcode scanner input
 * USB scanners typically simulate keyboard input ending with Enter
 */
export function useUsbScanner(onScan: (barcode: string) => void) {
  const [isUsbConnected, setIsUsbConnected] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  useEffect(() => {
    let buffer = "";
    let timeout: NodeJS.Timeout;

    // Detect USB scanner by monitoring rapid keyboard input
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // USB scanners send Enter key after barcode
      if (e.key === "Enter" && buffer.length > 0) {
        setIsUsbConnected(true);
        setLastScan(buffer);
        onScan(buffer);
        buffer = "";
        clearTimeout(timeout);
      } else if (e.key.length === 1) {
        // Build barcode from rapid key presses
        buffer += e.key;
        setIsUsbConnected(true);

        // Clear buffer if typing stops (USB scanners are very fast)
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = "";
        }, 100);
      }
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      clearTimeout(timeout);
    };
  }, [onScan]);

  return {
    isUsbConnected,
    lastScan,
  };
}
