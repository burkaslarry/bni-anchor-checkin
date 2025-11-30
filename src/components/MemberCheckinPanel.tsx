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
  
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [supportsDetector, setSupportsDetector] = useState(false);
  const [lastScanned, setLastScanned] = useState("");

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
      }
    } catch {
      // Camera not available
    }
  }, []);

  useEffect(() => {
    void initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [initCamera]);

  useEffect(() => {
    if ("BarcodeDetector" in window) {
      detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
      setSupportsDetector(true);
    }
  }, []);

  // Handle QR scan
  const handleScan = async () => {
    if (!supportsDetector || !detectorRef.current || !videoRef.current) {
      onNotify("此裝置不支援 QR 掃描", "error");
      return;
    }

    setScanStatus("scanning");
    const video = videoRef.current;
    
    if (!video.videoWidth || !video.videoHeight) {
      onNotify("相機尚未準備好", "error");
      setScanStatus("idle");
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
        throw new Error("No QR code detected");
      }

      const qrData = barcodes[0].rawValue;
      setLastScanned(qrData);
      
      // Try to parse QR and find matching member
      let memberName = "";
      
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.name && parsed.type === "member") {
          memberName = parsed.name;
        }
      } catch {
        const parts = qrData.split("-");
        if (parts.length >= 2 && parts[1] === "ANCHOR") {
          memberName = parts[0];
        }
      }

      // Find matching member in list
      if (memberName) {
        const match = members.find(
          (m) => m.name.toLowerCase() === memberName.toLowerCase()
        );
        if (match) {
          setSelectedMember(match.name);
          setScanStatus("success");
          onNotify(`已識別會員: ${match.name}`, "success");
        } else {
          setScanStatus("error");
          onNotify(`找不到會員: ${memberName}`, "error");
        }
      } else {
        setScanStatus("error");
        onNotify("QR 碼格式不正確", "error");
      }
    } catch {
      setScanStatus("error");
      onNotify("未偵測到 QR 碼", "error");
    }
  };

  // Submit check-in (only submit name, backend will lookup domain)
  const handleSubmit = async () => {
    if (!selectedMember) {
      onNotify("請選擇會員", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await checkIn({
        name: selectedMember,
        type: "member",
        currentTime: new Date().toISOString()
      });

      if (result.status === "success") {
        onNotify(`✅ ${selectedMember} 簽到成功！`, "success");
        setSelectedMember("");
        setLastScanned("");
        setScanStatus("idle");
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

  // Get selected member's domain for preview
  const selectedMemberInfo = members.find(m => m.name === selectedMember);

  return (
    <section className="section checkin-panel member-checkin">
      <div className="section-header">
        <h2>👤 會員簽到</h2>
        <p className="hint">掃描 QR 碼或從下拉選單選擇會員</p>
      </div>

      {/* Camera Scanner */}
      <div className="scanner-section">
        <div className="video-wrapper compact">
          <video ref={videoRef} muted playsInline autoPlay />
        </div>
        <button
          className="button scan-button"
          type="button"
          onClick={handleScan}
          disabled={!supportsDetector || scanStatus === "scanning"}
        >
          {scanStatus === "scanning" ? "⏳ 掃描中..." : "📷 掃描 QR 碼"}
        </button>
        {lastScanned && (
          <p className="hint scanned-data">
            已掃描: <code>{lastScanned.substring(0, 50)}...</code>
          </p>
        )}
      </div>

      <div className="divider">
        <span>或選擇會員</span>
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
