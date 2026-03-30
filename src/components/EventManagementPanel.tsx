import { useState, useEffect, useCallback } from "react";
import { getCurrentEvent, clearAllEventsAndAttendance, EventData, exportRecords, listEvents } from "../api";

type EventManagementPanelProps = {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
  onNavigateToStrategic?: () => void;
  onNavigateToGenerate?: () => void;
};

export const EventManagementPanel = ({ onNotify, onNavigateToStrategic, onNavigateToGenerate }: EventManagementPanelProps) => {
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchCurrentEvent = useCallback(async () => {
    setLoading(true);
    try {
      const event = await getCurrentEvent();
      setCurrentEvent(event);
      const events = await listEvents();
      setAllEvents(Array.isArray(events) ? events : []);
    } catch {
      setCurrentEvent(null);
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentEvent();
  }, [fetchCurrentEvent]);

  // Auto-redirect to generate page if no event exists
  useEffect(() => {
    if (!loading && !currentEvent && onNavigateToGenerate) {
      const timer = setTimeout(() => {
        onNotify("尚未建立活動，正在導向新增活動頁面...", "info");
        onNavigateToGenerate();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, currentEvent, onNavigateToGenerate, onNotify]);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await clearAllEventsAndAttendance();
      setCurrentEvent(null);
      setShowDeleteConfirm(false);
      onNotify("已清除所有活動和簽到記錄", "success");
    } catch (error) {
      onNotify("清除失敗: " + (error instanceof Error ? error.message : "未知錯誤"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportTodayCsv = async () => {
    setExporting(true);
    try {
      const blob = await exportRecords();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      onNotify("已匯出 CSV（包含缺席名單）", "success");
    } catch (e) {
      onNotify("匯出失敗: " + (e instanceof Error ? e.message : "未知錯誤"), "error");
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return time;
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <section className="section event-management-panel">
      <div className="section-header">
        <h2>📅 活動管理</h2>
        <p className="hint">查看和管理目前的活動</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <span>載入中...</span>
        </div>
      ) : currentEvent ? (
        <div className="event-details">
          <div className="event-card">
            <div className="event-card-header">
              <h3>{currentEvent.name}</h3>
              <span className="event-id">ID: {currentEvent.id}</span>
            </div>
            
            <div className="event-info-grid">
              <div className="info-item">
                <span className="info-label">📆 活動日期</span>
                <span className="info-value">{currentEvent.date}</span>
              </div>
              <div className="info-item">
                <span className="info-label">🕐 登記開始</span>
                <span className="info-value">{formatTime(currentEvent.registrationStartTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">🚀 活動開始</span>
                <span className="info-value">{formatTime(currentEvent.startTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">⏰ 準時截止</span>
                <span className="info-value highlight">{formatTime(currentEvent.onTimeCutoff)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">🏁 活動結束</span>
                <span className="info-value">{formatTime(currentEvent.endTime)}</span>
              </div>
            </div>

            <div className="event-actions">
              <button
                className="ghost-button refresh-btn"
                type="button"
                onClick={fetchCurrentEvent}
              >
                🔄 重新整理
              </button>
              <button
                className="button"
                type="button"
                onClick={handleExportTodayCsv}
                disabled={exporting}
                style={{ backgroundColor: "#0ea5e9" }}
              >
                {exporting ? "⏳ 匯出中..." : "📥 當日出席記錄 CSV（含缺席）"}
              </button>
              <a
                href={`/admin/guests?eventDate=${encodeURIComponent(currentEvent.date)}`}
                className="button"
                style={{ backgroundColor: "#10b981" }}
              >
                🎫 本活動嘉賓名單
              </a>
            </div>
          </div>

          <div className="section" style={{ marginTop: "1rem" }}>
            <div className="section-header">
              <h3>🗂️ 過往活動</h3>
              <p className="hint">顯示 bni_anchor_events 全部活動（最新在最頂，按 id 由大到細）</p>
            </div>

            {allEvents.length === 0 ? (
              <p className="hint">暫無活動資料</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>ID</th>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>活動名稱</th>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>日期</th>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>登記開始</th>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>開始</th>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>準時截止</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEvents.map((ev) => (
                      <tr key={ev.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "0.75rem" }}>{ev.id}</td>
                        <td style={{ padding: "0.75rem" }}>{ev.name}</td>
                        <td style={{ padding: "0.75rem" }}>{ev.date}</td>
                        <td style={{ padding: "0.75rem" }}>{formatTime(ev.registrationStartTime)}</td>
                        <td style={{ padding: "0.75rem" }}>{formatTime(ev.startTime)}</td>
                        <td style={{ padding: "0.75rem" }}>{formatTime(ev.onTimeCutoff)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="danger-zone">
            <h4>⚠️ 危險區域</h4>
            <p className="hint">刪除活動將同時清除所有簽到記錄</p>
            {!showDeleteConfirm ? (
              <button
                className="ghost-button danger-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ 刪除此活動
              </button>
            ) : (
              <div className="delete-confirm">
                <p className="warning-text">確定要刪除此活動和所有簽到記錄嗎？此操作無法復原！</p>
                <div className="confirm-buttons">
                  <button
                    className="button danger-btn"
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "⏳ 刪除中..." : "確認刪除"}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-event-state">
          <div className="empty-icon">📅</div>
          <h3>尚未建立活動</h3>
          <p className="hint">請先使用「產生 QR 碼」功能建立新活動</p>
        </div>
      )}
    </section>
  );
};

