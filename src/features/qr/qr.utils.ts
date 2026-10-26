import QRCode from "qrcode";

export type QrMode = "url" | "text" | "wifi";

export function buildQrPayload(mode: QrMode, value: string, ssid: string, password: string, security: string): string {
  if (mode === "url") {
    const input = value.trim();
    if (!input) return "";
    return /^https?:\/\//i.test(input) ? input : `https://${input}`;
  }
  if (mode === "text") return value.trim();
  if (!ssid.trim()) return "";
  const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${security};S:${escapeWifi(ssid.trim())};P:${escapeWifi(password)};;`;
}

export async function makeQrDataUrl(payload: string, size: number, foreground: string, background: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: foreground, light: background }
  });
}