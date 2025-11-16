import { useCallback, useEffect, useState } from "react";
import { NotificationEntry, ScanPanel } from "./components/ScanPanel";
import { NotificationStack } from "./components/NotificationStack";
import { SearchEventPanel } from "./components/SearchEventPanel";
import { SearchMemberPanel } from "./components/SearchMemberPanel";

type Role = "Admin" | "Staff";
type View = "home" | "scan" | "member" | "event";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const navTargets: { id: View; title: string; description: string; action: string }[] = [
  {
    id: "scan",
    title: "Scan QR Code",
    description: "Record attendance with the live camera and surface any queued entries.",
    action: "Open scanner"
  },
  {
    id: "member",
    title: "Search by Member Name",
    description: "Lookup attendance history and confirm presence for a member.",
    action: "Lookup member"
  },
  {
    id: "event",
    title: "Search by Event Date",
    description: "Review each attendee for a specific event date and status.",
    action: "Pick event date"
  }
];

const createNotificationId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export default function App() {
  const [activeView, setActiveView] = useState<View>("home");
  const [authProfile, setAuthProfile] = useState({ name: "Taylor Rivers", role: "Staff" as Role });
  const [nameDraft, setNameDraft] = useState(authProfile.name);
  const [roleDraft, setRoleDraft] = useState<Role>(authProfile.role);
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

  const handleRoleSave = () => {
    const finalName = nameDraft.trim() || "Team Member";
    setAuthProfile({ name: finalName, role: roleDraft });
    setNameDraft(finalName);
    setRoleDraft(roleDraft);
    notifyMessage(`Signed in as ${finalName} (${roleDraft}).`, "success");
  };

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

  const renderView = () => {
    if (activeView === "scan") {
      return <ScanPanel onNotify={pushNotification} />;
    }
    if (activeView === "member") {
      return <SearchMemberPanel onNotify={handleSearchNotification} />;
    }
    if (activeView === "event") {
      return <SearchEventPanel onNotify={handleSearchNotification} />;
    }
    return null;
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
          <span className="role-pill">{authProfile.role}</span>
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

      <section className="section role-panel">
        <div className="section-header">
          <h2>Secure Access</h2>
          <p className="hint">
            Pick a role and name to model the Admin or Staff mindset during the session.
          </p>
        </div>
        <div className="role-form">
          <input
            className="input-field"
            placeholder="Enter name"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
          />
          <select
            className="select-field"
            value={roleDraft}
            onChange={(event) => setRoleDraft(event.target.value as Role)}
          >
            <option value="Staff">Staff</option>
            <option value="Admin">Admin</option>
          </select>
          <button className="button" type="button" onClick={handleRoleSave}>
            Apply role
          </button>
        </div>
        <p className="hint">
          Signed in as <strong>{authProfile.name}</strong> with the{" "}
          <span className="role-pill">{authProfile.role}</span> role.
        </p>
      </section>

      {activeView === "home" && (
        <section className="section">
          <div className="section-header">
            <h2>Home</h2>
            <p className="hint">Tap a card to jump into a workflow.</p>
          </div>
          <div className="nav-grid">
            {navTargets.map((item) => (
              <button
                key={item.id}
                type="button"
                className="nav-card"
                onClick={() => setActiveView(item.id)}
              >
                <strong>{item.title}</strong>
                <span className="hint">{item.description}</span>
                <small>{item.action}</small>
              </button>
            ))}
          </div>
          <p className="hint">
            {isOnline
              ? "Camera scanning will immediately record attendance."
              : "Offline mode active. Scans queue locally and sync when online."}
          </p>
        </section>
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


