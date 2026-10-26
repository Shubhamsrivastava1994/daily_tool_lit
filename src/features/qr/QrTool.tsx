import { useEffect, useState } from "react";
import { Download, Link2, QrCode, Type, Wifi } from "lucide-react";
import { buildQrPayload, makeQrDataUrl, type QrMode } from "./qr.utils";

function saveDataUrl(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
}

export default function QrTool() {
  const [mode, setMode] = useState<QrMode>("url");
  const [value, setValue] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState("WPA");
  const [foreground, setForeground] = useState("#172033");
  const [background, setBackground] = useState("#ffffff");
  const [size, setSize] = useState(320);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");

  const payload = buildQrPayload(mode, value, ssid, password, security);

  useEffect(() => {
    let cancelled = false;
    if (!payload) { setQr(""); setError(""); return; }
    makeQrDataUrl(payload, size, foreground, background)
      .then(data => { if (!cancelled) { setQr(data); setError(""); } })
      .catch(() => { if (!cancelled) setError("QR code could not be generated. Try shorter content."); });
    return () => { cancelled = true; };
  }, [payload, size, foreground, background]);

  return (
    <div className="tool-panel">
      <div className="panel-heading"><div><span className="panel-kicker">TOOL 01</span><h2>QR Code Generator</h2><p>Turn a link, message, or Wi-Fi details into a scannable code.</p></div><span className="heading-icon purple"><QrCode size={23}/></span></div>
      <div className="qr-layout">
        <div className="tool-form">
          <div className="segmented">
            <button className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}><Link2 size={16}/> Website</button>
            <button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}><Type size={16}/> Text</button>
            <button className={mode === "wifi" ? "active" : ""} onClick={() => setMode("wifi")}><Wifi size={16}/> Wi-Fi</button>
          </div>
          {mode === "url" && <label className="field-label">Website URL<input value={value} onChange={e => setValue(e.target.value)} placeholder="https://yourwebsite.com"/><small>Enter a domain or full website link.</small></label>}
          {mode === "text" && <label className="field-label">Text or message<textarea rows={4} value={value} onChange={e => setValue(e.target.value)} placeholder="Write your message..."/></label>}
          {mode === "wifi" && <div className="stack-fields"><label className="field-label">Network name<input value={ssid} onChange={e => setSsid(e.target.value)} placeholder="Wi-Fi name"/></label><label className="field-label">Password<input value={password} onChange={e => setPassword(e.target.value)} placeholder="Wi-Fi password"/></label><label className="field-label">Security<select value={security} onChange={e => setSecurity(e.target.value)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></label></div>}
          <div className="form-divider"/>
          <div className="subheading"><strong>Customize</strong><span>Make it yours</span></div>
          <div className="color-fields">
            <label className="field-label">QR color<span className="color-input"><input type="color" value={foreground} onChange={e => setForeground(e.target.value)}/><code>{foreground.toUpperCase()}</code></span></label>
            <label className="field-label">Background<span className="color-input"><input type="color" value={background} onChange={e => setBackground(e.target.value)}/><code>{background.toUpperCase()}</code></span></label>
          </div>
          <div className="range-label"><label htmlFor="qr-size">Image size</label><strong>{size} × {size}px</strong></div>
          <input id="qr-size" className="range-input" type="range" min="200" max="640" step="40" value={size} onChange={e => setSize(Number(e.target.value))}/>
          {error && <p className="error-text">{error}</p>}
        </div>
        <aside className="qr-preview">
          <div className="preview-label"><span className="status-dot"/> LIVE PREVIEW</div>
          <div className="qr-canvas">{qr ? <img src={qr} alt="Generated QR code"/> : <div className="qr-empty"><QrCode size={58}/><span>Add details to create a QR</span></div>}</div>
          <p className="preview-caption">Scan with your phone camera to test.</p>
          <button className="button-primary full-width" disabled={!qr} onClick={() => saveDataUrl(qr, "littletools-qr.png")}><Download size={17}/> Download PNG</button>
        </aside>
      </div>
    </div>
  );
}