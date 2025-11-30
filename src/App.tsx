import { useCallback, useEffect, useState } from "react";
import { NotificationEntry, ScanPanel } from "./components/ScanPanel";
import { NotificationStack } from "./components/NotificationStack";
import { SearchEventPanel } from "./components/SearchEventPanel";
import { SearchMemberPanel } from "./components/SearchMemberPanel";
import { QRGeneratorPanel } from "./components/QRGeneratorPanel";
import { ManualEntryPanel } from "./components/ManualEntryPanel";
import { RecordsPanel } from "./components/RecordsPanel";
import { ExportPanel } from "./components/ExportPanel";
import { MemberCheckinPanel } from "./components/MemberCheckinPanel";
import { GuestCheckinPanel } from "./components/GuestCheckinPanel";

type View = "home" | "admin" | "member-checkin" | "guest-checkin" | "generate" | "scan" | "manual" | "records" | "export" | "member" | "event";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Main check-in options (featured)
const mainCheckinOptions: { id: View; title: string; description: string; action: string; icon: string }[] = [
  {
    id: "member-checkin",
    title: "會員簽到",
    description: "BNI Anchor 會員專用，掃描 QR 或選擇姓名",
    action: "Member Check-in",
    icon: "👤"
  },
  {
    id: "guest-checkin",
    title: "來賓簽到",
    description: "訪客簽到，掃描 QR 或輸入姓名",
    action: "Guest Check-in",
    icon: "🎫"
  }
];

// Additional tools
const navTargets: { id: View; title: string; description: string; action: string; icon: string }[] = [
  {
    id: "generate",
    title: "產生 QR 碼",
    description: "產生簽到用 QR Code",
    action: "Generate QR",
    icon: "🔳"
  },
  {
    id: "records",
    title: "簽到記錄",
    description: "查看所有簽到資料",
    action: "View Records",
    icon: "📋"
  },
  {
    id: "export",
    title: "匯出資料",
    description: "匯出 CSV 檔案",
    action: "Export CSV",
    icon: "📥"
  },
  {
    id: "member",
    title: "會員查詢",
    description: "查詢出席歷史",
    action: "Search",
    icon: "🔍"
  }
];

const createNotificationId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export default function App() {
  const [activeView, setActiveView] = useState<View>("home");
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const pushNotification = useCallback((note: NotificationEntry) => {
    setNotifications((current) => [...current, note]);
    setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== note.id));
    }, 4500);
  }, []);

  const notifyMessage = useCallback(
    (message: string, type: NotificationEntry["type"] = "info") => {
      pushNotification({
        id: createNotificationId(),
        type,
        message
      });
    },
    [pushNotification]
  );

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    notifyMessage(
      choice.outcome === "accepted"
        ? "Add to home screen accepted."
        : "Install prompt dismissed.",
      choice.outcome === "accepted" ? "success" : "info"
    );
    setInstallPrompt(null);
  }, [installPrompt, notifyMessage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleSearchNotification = useCallback(
    (message: string) => notifyMessage(message, "error"),
    [notifyMessage]
  );

  const handlePanelNotification = useCallback(
    (message: string, type: "success" | "error" | "info") => notifyMessage(message, type),
    [notifyMessage]
  );

  const renderView = () => {
    switch (activeView) {
      case "admin":
        return (
          <section className="section admin-panel">
            <div className="section-header">
              <h2>🛠️ 管理工具</h2>
              <p className="hint">管理與匯出功能</p>
            </div>
            <div className="nav-grid">
              {navTargets.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="nav-card"
                  onClick={() => setActiveView(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <strong className="nav-title">{item.title}</strong>
                  <span className="hint">{item.description}</span>
                </button>
              ))}
            </div>
          </section>
        );
      case "member-checkin":
        return <MemberCheckinPanel onNotify={handlePanelNotification} />;
      case "guest-checkin":
        return <GuestCheckinPanel onNotify={handlePanelNotification} />;
      case "generate":
        return <QRGeneratorPanel onNotify={handlePanelNotification} />;
      case "scan":
        return <ScanPanel onNotify={pushNotification} />;
      case "manual":
        return <ManualEntryPanel onNotify={handlePanelNotification} />;
      case "records":
        return <RecordsPanel onNotify={handlePanelNotification} />;
      case "export":
        return <ExportPanel onNotify={handlePanelNotification} />;
      case "member":
        return <SearchMemberPanel onNotify={handleSearchNotification} />;
      case "event":
        return <SearchEventPanel onNotify={handleSearchNotification} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <NotificationStack notifications={notifications} />
      <header className="site-header">
        <div>
          <p className="hint">BNI Anchor Checkin</p>
          <h1>QR Code Attendance</h1>
          <p className="hint">Mobile-first, offline-friendly checkins with instant feedback.</p>
        </div>
        <div className="header-meta">
          <span className={`connection-pill ${isOnline ? "online" : "offline"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
          {installPrompt && (
            <button className="ghost-button install-cta" type="button" onClick={handleInstall}>
              Add to home screen
            </button>
          )}
        </div>
      </header>

      {activeView === "home" && (
        <>
          {/* Main Check-in Options */}
          <section className="section featured-section">
            <div className="section-header">
              <h2>📍 簽到入口</h2>
              <p className="hint">選擇您的身份進行簽到</p>
            </div>
            <div className="checkin-buttons">
              {mainCheckinOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`checkin-card ${item.id}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <span className="checkin-icon">{item.icon}</span>
                  <strong>{item.title}</strong>
                  <span className="hint">{item.description}</span>
                  <small className="nav-action">{item.action} →</small>
                </button>
              ))}
            </div>
          </section>

          {/* Admin Link */}
          <div className="admin-link-container">
            <button
              type="button"
              className="admin-link"
              onClick={() => setActiveView("admin")}
            >
              🛠️ 管理工具 (Admin)
            </button>
          </div>

          <p className="hint status-hint">
            {isOnline
              ? "✅ 連線正常，簽到將即時記錄"
              : "⚠️ 離線模式，簽到將在連線後同步"}
          </p>
        </>
      )}

      {activeView !== "home" && (
        <div className="section back-action">
          <button className="ghost-button" type="button" onClick={() => setActiveView("home")}>
            ← Return to home
          </button>
        </div>
      )}

      {renderView()}
    </div>
  );
}


