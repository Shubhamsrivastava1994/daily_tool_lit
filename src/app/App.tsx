import { useState } from "react";
import { ArrowLeft, ArrowRight, FileText, Image, QrCode, ShieldCheck, Wrench } from "lucide-react";
import AppHeader from "../components/AppHeader";
import QrTool from "../features/qr/QrTool";
import ImageCompressorTool from "../features/image-compressor/ImageCompressorTool";
import PhotoToPdfTool from "../features/photo-to-pdf/PhotoToPdfTool";

export type ToolId = "qr" | "compress" | "photo-pdf";

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  return (
    <div className="site-shell">
      <AppHeader />
      <main className="page-wrap">
        {!activeTool ? (
          <>
            <section className="hero">
              <span className="eyebrow">LITTLETOOLS / TOOLBOX</span>
              <h1>What do you need<br className="desktop-break" /> to do today?</h1>
              <p>Choose a tool to get started. Simple, fast, and free to use.</p>
            </section>

            <section className="tool-library" aria-label="Available tools">
              <button type="button" className="library-card" onClick={() => setActiveTool("qr")}>
                <span className="library-card-icon qr-icon"><QrCode size={25}/></span>
                <span className="library-card-body">
                  <span className="library-card-number">TOOL 01</span>
                  <strong>QR Code Generator</strong>
                  <small>Create QR codes for links, text, and Wi-Fi.</small>
                </span>
                <span className="library-card-action"><ArrowRight size={18}/></span>
              </button>

              <button type="button" className="library-card" onClick={() => setActiveTool("compress")}>
                <span className="library-card-icon image-icon"><Image size={25}/></span>
                <span className="library-card-body">
                  <span className="library-card-number">TOOL 02</span>
                  <strong>Image Compressor</strong>
                  <small>Reduce image size to under 1 MB.</small>
                </span>
                <span className="library-card-action"><ArrowRight size={18}/></span>
              </button>

              <button type="button" className="library-card" onClick={() => setActiveTool("photo-pdf")}>
                <span className="library-card-icon pdf-icon"><FileText size={25}/></span>
                <span className="library-card-body">
                  <span className="library-card-number">TOOL 03</span>
                  <strong>Photo to PDF</strong>
                  <small>Combine up to 10 photos into one PDF.</small>
                </span>
                <span className="library-card-action"><ArrowRight size={18}/></span>
              </button>

              <div className="coming-soon-card">
                <span className="coming-icon"><Wrench size={19}/></span>
                <span><strong>More tools can be added</strong><small>This toolbox is designed to grow with new modules.</small></span>
              </div>
            </section>

            <div className="privacy-strip"><ShieldCheck size={17}/><span><strong>Private by design.</strong> Your text and images are processed in your browser, not uploaded.</span></div>
          </>
        ) : (
          <>
            <button className="back-to-tools" type="button" onClick={() => setActiveTool(null)}>
              <ArrowLeft size={16}/> Back to all tools
            </button>
            <section className="active-tool-page">
              {activeTool === "qr" ? <QrTool /> : activeTool === "compress" ? <ImageCompressorTool /> : <PhotoToPdfTool />}
            </section>
          </>
        )}
        <footer className="site-footer"><span><Wrench size={14}/> LittleTools</span><span>Small tools, simple solutions.</span></footer>
      </main>
    </div>
  );
}