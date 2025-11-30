import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { NotificationStack } from "../components/NotificationStack";
import { NotificationEntry } from "../components/ScanPanel";
import { QRGeneratorPanel } from "../components/QRGeneratorPanel";
import { RecordsPanel } from "../components/RecordsPanel";
import { ExportPanel } from "../components/ExportPanel";
import { SearchMemberPanel } from "../components/SearchMemberPanel";

type AdminView = "home" | "generate" | "records" | "export" | "member";

const navTargets: { id: AdminView; title: string; description: string; icon: string }[] = [
  {
    id: "generate",
    title: "產生 QR 碼",
    description: "產生活動簽到用 QR Code",
    icon: "🔳"
  },
  {
    id: "records",
    title: "簽到記錄",
    description: "查看所有簽到資料",
    icon: "📋"
  },
  {
    id: "export",
    title: "匯出資料",
    description: "匯出 CSV 檔案",
    icon: "📥"
  },
  {
    id: "member",
    title: "會員查詢",
    description: "查詢出席歷史",
    icon: "🔍"
  }
];

const createNotificationId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export default function AdminPage() {
  const [activeView, setActiveView] = useState<AdminView>("home");
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

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

  const handlePanelNotification = useCallback(
    (message: string, type: "success" | "error" | "info") => notifyMessage(message, type),
    [notifyMessage]
  );

  const handleSearchNotification = useCallback(
    (message: string) => notifyMessage(message, "error"),
    [notifyMessage]
  );

  const renderView = () => {
    switch (activeView) {
      case "generate":
        return <QRGeneratorPanel onNotify={handlePanelNotification} />;
      case "records":
        return <RecordsPanel onNotify={handlePanelNotification} />;
      case "export":
        return <ExportPanel onNotify={handlePanelNotification} />;
      case "member":
        return <SearchMemberPanel onNotify={handleSearchNotification} />;
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
          <h1>🛠️ 管理工具</h1>
          <p className="hint">Admin Dashboard</p>
        </div>
        <div className="header-meta">
          <Link to="/" className="ghost-button back-home-btn">
            ← 返回首頁
          </Link>
        </div>
      </header>

      {activeView === "home" && (
        <section className="section admin-panel">
          <div className="section-header">
            <h2>選擇功能</h2>
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
      )}

      {activeView !== "home" && (
        <div className="section back-action">
          <button className="ghost-button" type="button" onClick={() => setActiveView("home")}>
            ← 返回管理首頁
          </button>
        </div>
      )}

      {renderView()}
    </div>
  );
}

