import { useState, useEffect, useCallback, useRef } from "react";
import { checkIn, getMembers, MemberInfo } from "../api";

interface BarcodeDetectorOptions {
  formats?: string[];
}

interface BarcodeDetection {
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  detect(source: ImageBitmapSource): Promise<BarcodeDetection[]>;
}

type MemberCheckinPanelProps = {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
};

export const MemberCheckinPanel = ({ onNotify }: MemberCheckinPanelProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>("");
  const isCameraReadyRef = useRef(false);
  
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("scanning");
  const [supportsDetector, setSupportsDetector] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const [eventInfo, setEventInfo] = useState<{ eventName: string; eventDate: string } | null>(null);

  // Fetch members list
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers();
        setMembers(data.members);
      } catch {
        onNotify("無法載入會員名單", "error");
      }
    };
    fetchMembers();
  }, [onNotify]);

  // Initialize camera
  const initCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // Mark camera as ready after video starts playing
        videoRef.current.onloadedmetadata = () => {
          isCameraReadyRef.current = true;
        };
      }
    } catch {
      // Camera not available
    }
  }, []);

  useEffect(() => {
    void initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [initCamera]);

  useEffect(() => {
    if ("BarcodeDetector" in window) {
      detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
      setSupportsDetector(true);
    }
  }, []);

  // Auto-scan function (silent, no notifications on failure)
  const performAutoScan = useCallback(async () => {
    if (!supportsDetector || !detectorRef.current || !videoRef.current || !isCameraReadyRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const barcodes = await detectorRef.current.detect(canvas);
      if (!barcodes.length) {
        return; // No QR code found, continue scanning silently
      }

      const qrData = barcodes[0].rawValue;
      
      // Prevent duplicate scans of the same QR code
      if (qrData === lastScannedRef.current) {
        return;
      }
      
      lastScannedRef.current = qrData;
      setLastScanned(qrData);
      
      // Try to parse QR code
      try {
        const parsed = JSON.parse(qrData);
        
        // Check if it's an event QR code
        if (parsed.eventName && parsed.eventDate) {
          setEventInfo({ eventName: parsed.eventName, eventDate: parsed.eventDate });
          setScanStatus("success");
          onNotify(`✅ 活動確認: ${parsed.eventName} (${parsed.eventDate})`, "success");
          return;
        }
        
        // Check if it's a member QR code
        if (parsed.name && parsed.type === "member") {
          const match = members.find(
            (m) => m.name.toLowerCase() === parsed.name.toLowerCase()
          );
          if (match) {
            setSelectedMember(match.name);
            setScanStatus("success");
            onNotify(`✅ 已識別會員: ${match.name}`, "success");
            return;
          }
        }
      } catch {
        // Not JSON, try other formats
        const parts = qrData.split("-");
        if (parts.length >= 2 && parts[1] === "ANCHOR") {
          const memberName = parts[0];
          const match = members.find(
            (m) => m.name.toLowerCase() === memberName.toLowerCase()
          );
          if (match) {
            setSelectedMember(match.name);
            setScanStatus("success");
            onNotify(`✅ 已識別會員: ${match.name}`, "success");
            return;
          }
        }
      }
    } catch {
      // Silently ignore scan errors during auto-scan
    }
  }, [supportsDetector, members, onNotify]);

  // Start auto-scanning when camera and detector are ready
  useEffect(() => {
    if (!supportsDetector) {
      return;
    }

    // Start scanning interval (every 300ms for faster detection)
    scanIntervalRef.current = window.setInterval(() => {
      void performAutoScan();
    }, 300);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [supportsDetector, performAutoScan]);

  // Reset lastScannedRef when user clears selection (to allow re-scan of same QR)
  useEffect(() => {
    if (!selectedMember && !eventInfo) {
      lastScannedRef.current = "";
    }
  }, [selectedMember, eventInfo]);

  // Submit check-in
  const handleSubmit = async () => {
    if (!selectedMember) {
      onNotify("請選擇會員", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use local time format instead of UTC ISO string
      const now = new Date();
      const localTimeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const result = await checkIn({
        name: selectedMember,
        type: "member",
        currentTime: localTimeString
      });

      if (result.status === "success") {
        onNotify(`✅ ${selectedMember} 簽到成功！`, "success");
        setSelectedMember("");
        setLastScanned("");
        setScanStatus("scanning");
        setEventInfo(null);
        lastScannedRef.current = ""; // Allow re-scan
      } else {
        onNotify(`❌ ${result.message}`, "error");
      }
    } catch (error) {
      let message = "簽到失敗";
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          message = parsed.message || error.message;
        } catch {
          message = error.message;
        }
      }
      onNotify(`❌ ${message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMemberInfo = members.find(m => m.name === selectedMember);

  return (
    <section className="section checkin-panel member-checkin">
      <div className="section-header">
        <h2>👤 會員簽到</h2>
        <p className="hint">掃描活動 QR 碼，然後選擇會員</p>
      </div>

      {/* Event Info Display */}
      {eventInfo && (
        <div className="event-info-banner">
          <span className="event-icon">📅</span>
          <div>
            <strong>{eventInfo.eventName}</strong>
            <span className="event-date">{eventInfo.eventDate}</span>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      <div className="scanner-section">
        <div className="video-wrapper compact">
          <video ref={videoRef} muted playsInline autoPlay />
          {scanStatus === "scanning" && supportsDetector && (
            <div className="auto-scan-indicator">
              <span className="pulse-dot"></span>
              掃描中...
            </div>
          )}
          {scanStatus === "success" && (
            <div className="auto-scan-indicator success">
              ✅ 掃描成功
            </div>
          )}
        </div>
        
        {lastScanned && (
          <p className="hint scanned-data">
            已掃描: <code>{lastScanned.substring(0, 50)}{lastScanned.length > 50 ? "..." : ""}</code>
          </p>
        )}
      </div>

      <div className="divider">
        <span>選擇會員</span>
      </div>

      {/* Member Dropdown */}
      <div className="form-group">
        <label htmlFor="member-select">選擇會員</label>
        <select
          id="member-select"
          className="select-field"
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
        >
          <option value="">-- 請選擇會員 --</option>
          {members.map((member) => (
            <option key={member.name} value={member.name}>
              {member.name} - {member.domain}
            </option>
          ))}
        </select>
        <p className="hint">共 {members.length} 位會員</p>
      </div>

      {/* Preview & Submit */}
      {selectedMember && (
        <div className="checkin-preview">
          <div className="preview-info">
            <span className="preview-icon">👤</span>
            <div>
              <strong>{selectedMember}</strong>
              {selectedMemberInfo && (
                <span className="domain-text">{selectedMemberInfo.domain}</span>
              )}
              <span className="type-badge member">會員</span>
            </div>
          </div>
          <p className="hint">
            簽到時間: {new Date().toLocaleString("zh-TW")}
          </p>
        </div>
      )}

      <button
        className="button submit-button"
        type="button"
        onClick={handleSubmit}
        disabled={!selectedMember || isSubmitting}
      >
        {isSubmitting ? "⏳ 處理中..." : "✅ 確認簽到"}
      </button>
    </section>
  );
};
