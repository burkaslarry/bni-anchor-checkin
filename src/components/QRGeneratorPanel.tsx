import { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

type QRGeneratorPanelProps = {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
};

export const QRGeneratorPanel = ({ onNotify }: QRGeneratorPanelProps) => {
  const [eventName, setEventName] = useState("BNI Anchor Meeting");
  const [eventDate, setEventDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const qrData = useMemo(() => {
    if (!eventName.trim() || !eventDate) return null;
    return {
      eventName: eventName.trim(),
      eventDate: eventDate
    };
  }, [eventName, eventDate]);

  const qrString = qrData ? JSON.stringify(qrData) : "";

  const handleCopy = async () => {
    if (!qrString) {
      onNotify("請先輸入活動資訊", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(qrString);
      onNotify("QR 字串已複製到剪貼簿", "success");
    } catch {
      onNotify("複製失敗，請手動複製", "error");
    }
  };

  const handleDownload = () => {
    if (!qrString) {
      onNotify("請先輸入活動資訊", "error");
      return;
    }
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0, 300, 300);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Event-${eventDate}.png`;
      link.href = pngUrl;
      link.click();
      onNotify("QR 碼已下載", "success");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <section className="section qr-generator-panel">
      <div className="section-header">
        <h2>🔳 產生活動 QR 碼</h2>
        <p className="hint">產生活動簽到用 QR Code</p>
      </div>

      <div className="form-group">
        <label htmlFor="event-name-input">活動名稱 Event Name</label>
        <input
          id="event-name-input"
          className="input-field"
          placeholder="例如: BNI Anchor Meeting"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="date-input">活動日期 Event Date</label>
        <input
          id="date-input"
          className="input-field"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      </div>

      {qrData && (
        <div className="qr-preview">
          <div className="qr-code-container">
            <QRCodeSVG
              id="qr-code-svg"
              value={qrString}
              size={200}
              level="H"
              bgColor="#ffffff"
              fgColor="#030712"
              marginSize={2}
            />
          </div>
          <div className="qr-info-display">
            <div className="qr-info-row">
              <span className="qr-info-label">📅 活動名稱:</span>
              <span className="qr-info-value">{qrData.eventName}</span>
            </div>
            <div className="qr-info-row">
              <span className="qr-info-label">📆 活動日期:</span>
              <span className="qr-info-value">{qrData.eventDate}</span>
            </div>
          </div>
          <div className="qr-string-display">
            <code>{qrString}</code>
          </div>
          <div className="qr-actions">
            <button className="button" type="button" onClick={handleCopy}>
              📋 複製字串
            </button>
            <button className="ghost-button" type="button" onClick={handleDownload}>
              ⬇️ 下載 PNG
            </button>
          </div>
        </div>
      )}

      {!qrData && (
        <div className="qr-placeholder">
          <div className="placeholder-icon">🔳</div>
          <p className="hint">輸入活動資訊後將顯示 QR 碼</p>
        </div>
      )}

      <div className="format-info">
        <h4>📝 QR 碼格式說明</h4>
        <p className="hint">
          格式: <code>{`{ "eventName": "...", "eventDate": "yyyy-mm-dd" }`}</code>
        </p>
        <div className="format-example-box">
          <code>{`{"eventName":"BNI Anchor Meeting","eventDate":"2025-11-30"}`}</code>
        </div>
      </div>
    </section>
  );
};
