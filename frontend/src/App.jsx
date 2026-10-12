
import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Network,
  CircleDot,
  Search,
  LayoutDashboard,
  X,
  Clock,
  Radio,
  ChevronRight,
  Zap,
  Filter,
  Eye,
  Sun,
  Moon,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./App.css";
import ExplainabilityPanel from "./components/ExplainabilityPanel";
import InvestigationDrawer from "./components/InvestigationDrawer";


const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const SEVERITY_COLORS = {
  high: "#fb7185",
  medium: "#fbbf24",
  low: "#2dd4bf",
};

function Metric({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div className="metric card">
      <div className="metric-copy">
        <p className="muted">{title}</p>
        <h2>{value ?? "—"}</h2>
        <span className="metric-subtitle">{subtitle}</span>
      </div>
      <div className={`metric-icon ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search ID, category, result, or severity..."
      />
      {value && (
        <button
          className="icon-button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const normalized = (severity || "low").toLowerCase();

  return (
    <span className={`severity ${normalized}`}>
      <span className="severity-dot" />
      {normalized}
    </span>
  );
}

function DetectionTable({ items, onSelect, selectedId }) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <ShieldCheck size={28} />
        <strong>No detections found</strong>
        <p className="muted">Try changing your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Detection</th>
            <th>Classification</th>
            <th>Category</th>
            <th>Confidence</th>
            <th>Severity</th>
            <th>Timestamp</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`detection-row ${
                selectedId === item.id ? "selected-row" : ""
              }`}
              onClick={() => onSelect(item)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSelect(item);
              }}
            >
              <td>
                <span className="detection-id">DET-{item.id}</span>
              </td>
              <td>
                <span
                  className={`classification ${
                    item.is_attack ? "attack" : "normal"
                  }`}
                >
                  {item.is_attack ? "Attack" : "Normal"}
                </span>
              </td>
              <td>{item.attack_category}</td>
              <td>
                <div className="confidence-cell">
                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, item.attack_probability * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <span>
                    {(item.attack_probability * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
              <td>
                <SeverityBadge severity={item.severity} />
              </td>
              <td className="timestamp-cell">{item.created_at}</td>
              <td>
                <ChevronRight size={16} className="row-chevron" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



function App() {
  const [page, setPage] = useState("Overview");
  const [dashboard, setDashboard] = useState(null);
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(5);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch(`${API}/api/dashboard`),
        fetch(`${API}/api/detections?limit=100`),
        fetch(`${API}/api/alerts?limit=100`),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("The API returned an error.");
      }

      const [dashboardData, detectionData, alertData] = await Promise.all(
        responses.map((response) => response.json())
      );

      setDashboard(dashboardData);
      setDetections(detectionData);
      setAlerts(alertData);
      setLastUpdated(new Date());
    } catch {
      setError("Cannot connect to the backend. Check that FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }, []);

const [theme, setTheme] = useState(
  () => localStorage.getItem("sentinelai-theme") || "dark"
);

useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("sentinelai-theme", theme);
}, [theme]);

const updateAlertStatus = async (alertId, status) => {
  try {
    const response = await fetch(
      `${API}/api/alerts/${alertId}/status?status=${status}`,
      { method: "PATCH" }
    );

    if (!response.ok) {
      throw new Error("Failed to update alert status.");
    }

    const updatedAlert = await response.json();

    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, ...updatedAlert }
          : alert
      )
    );

    // Refresh dashboard counts, including open alerts.
    await loadData(true);
  } catch (error) {
    setError(error.message || "Could not update alert status.");
  }
};


  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
  if (!autoRefresh) {
    setCountdown(5);
    return undefined;
  }

  setCountdown(5);

  const timer = setInterval(() => {
    setCountdown((current) => {
      if (current <= 1) {
        loadData(true);
        return 5;
      }

      return current - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [autoRefresh, loadData]);

  const filteredDetections = detections.filter((item) => {
    const searchable = [
      item.id,
      item.attack_category,
      item.severity,
      item.is_attack ? "attack" : "normal",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(search.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" ||
      (item.severity || "").toLowerCase() === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === "all") return true;
    return (alert.status || "open").toLowerCase() === alertFilter;
  });

  const severityData = Object.entries(
    dashboard?.attack_severity_breakdown || {}
  ).map(([name, value]) => ({
    name: name.toLowerCase(),
    value,
  }));

  const timelineData = (() => {
    const grouped = {};

    detections.forEach((item) => {
      const date = new Date(item.created_at?.replace(" ", "T"));
      if (Number.isNaN(date.getTime())) return;

      const label = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!grouped[label]) {
        grouped[label] = { time: label, detections: 0, attacks: 0 };
      }

      grouped[label].detections += 1;
      if (item.is_attack) grouped[label].attacks += 1;
    });

    return Object.values(grouped).slice(-12);
  })();

  const highSeverity = detections.filter(
    (item) => item.is_attack && item.severity === "high"
  ).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h2>SentinelAI</h2>
            <p className="muted">Threat intelligence</p>
          </div>
        </div>

        <div className="environment-label">
          <span className="status-dot" />
          ML DETECTION ENGINE
        </div>

        <p className="nav-label">WORKSPACE</p>

        {[
          { name: "Overview", icon: LayoutDashboard },
          { name: "Detections", icon: Activity },
          { name: "Alerts", icon: ShieldAlert },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`nav-item ${page === name ? "active" : ""}`}
            onClick={() => setPage(name)}
          >
            <Icon size={19} />
            <span>{name}</span>
            {name === "Alerts" && alerts.length > 0 && (
              <span className="nav-count">{alerts.length}</span>
            )}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-dot" />
            <div>
              <strong>API connection</strong>
              <p className="muted">{error ? "Disconnected" : "Monitoring"}</p>
            </div>
          </div>
          <p className="sidebar-version">SENTINELAI · v1.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              SECURITY OPERATIONS <ChevronRight size={13} /> {page.toUpperCase()}
            </div>
            <h1>
              {page === "Overview"
                ? "Threat command center"
                : page === "Detections"
                  ? "Detection explorer"
                  : "Incident queue"}
            </h1>
            <p className="muted topbar-subtitle">
              {page === "Overview"
                ? "Monitor predictions and investigate network activity."
                : page === "Detections"
                  ? "Search, filter, and investigate model predictions."
                  : "Review generated alerts and their current status."}
            </p>
          </div>

          <div className="topbar-actions">
            <button
  className="filter-button theme-toggle"
  onClick={() =>
    setTheme((current) => current === "dark" ? "light" : "dark")
  }
  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
>
  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
  {theme === "dark" ? "Light mode" : "Dark mode"}
</button>
            <button
              className={`filter-button live-toggle ${
                autoRefresh ? "selected" : ""
              }`}
              onClick={() => setAutoRefresh((current) => !current)}
            >
              <Radio size={15} />
              {autoRefresh ? "Live on" : "Live off"}
            </button>
            <button
              className="refresh-button"
              onClick={() => loadData()}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {loading && !dashboard ? (
          <div className="panel loading-panel">
            <div className="loading-pulse" />
            <strong>Connecting to SentinelAI...</strong>
            <p className="muted">Loading detections, alerts, and metrics.</p>
          </div>
        ) : (
          <>
            {page === "Overview" && (
              <>
                <div className="system-strip">
                  <div>
                    <span className="status-dot" />
                    <span>DETECTION SERVICE</span>
                    <strong>{error ? "OFFLINE" : "CONNECTED"}</strong>
                  </div>
                  <div>
                    <Clock size={14} />
                    <span>
                      {lastUpdated
                        ? `Updated ${lastUpdated.toLocaleTimeString()}`
                        : "Awaiting data"}
                    </span>
                  </div>
                  <div>
                    <Zap size={14} />
                    <span>
                      {autoRefresh
                       ? `Next Refresh in ${countdown}s`
                       : "Auto-refresh paused"}
                    </span>
                  </div>
                </div>

                <section className="metrics-grid">
                  <Metric
                    title="Total detections"
                    value={dashboard?.total_detections ?? 0}
                    icon={Network}
                    color="teal"
                    subtitle="Stored traffic records"
                  />
                  <Metric
                    title="Predicted attacks"
                    value={dashboard?.predicted_attacks ?? 0}
                    icon={AlertTriangle}
                    color="red"
                    subtitle="Flagged by the model"
                  />
                  <Metric
                    title="Predicted normal"
                    value={dashboard?.predicted_normal ?? 0}
                    icon={ShieldCheck}
                    color="blue"
                    subtitle="Classified as normal"
                  />
                  <Metric
                    title="High severity"
                    value={highSeverity}
                    icon={ShieldAlert}
                    color="orange"
                    subtitle="Predicted attacks only"
                  />
                </section>

                <section className="content-grid">
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <span className="eyebrow">THREAT DISTRIBUTION</span>
                        <h3>Attack severity</h3>
                        <p className="muted">
                          Select a segment to filter detections
                        </p>
                      </div>
                      <CircleDot size={20} className="panel-icon" />
                    </div>

                    {severityData.length ? (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie
                              data={severityData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={76}
                              innerRadius={49}
                              paddingAngle={5}
                              stroke="none"
                              onClick={(entry) => {
                                setSeverityFilter((current) =>
                                  current === entry.name ? "all" : entry.name
                                );
                                setPage("Detections");
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {severityData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={
                                    SEVERITY_COLORS[entry.name] || "#60a5fa"
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "#101827",
                                border: "1px solid #30415a",
                                borderRadius: "8px",
                                color: "#f1f5f9",
                              }}
                              formatter={(value, name) => [value, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="empty-chart">
                        <CircleDot size={28} />
                        <p>No attack severity data yet</p>
                      </div>
                    )}

                    <div className="legend">
                      {severityData.map((item) => (
                        <button
                          className="legend-item"
                          key={item.name}
                          onClick={() => {
                            setSeverityFilter(item.name);
                            setPage("Detections");
                          }}
                        >
                          <span
                            className="legend-dot"
                            style={{
                              backgroundColor:
                                SEVERITY_COLORS[item.name] || "#60a5fa",
                            }}
                          />
                          <span>{item.name}</span>
                          <strong>{item.value}</strong>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <span className="eyebrow">TELEMETRY</span>
                        <h3>Detection activity</h3>
                        <p className="muted">
                          Based on stored detection timestamps
                        </p>
                      </div>
                      <Activity size={20} className="panel-icon" />
                    </div>

                    {timelineData.length > 1 ? (
                      <div className="chart-container timeline-chart">
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={timelineData}>
                            <defs>
                              <linearGradient
                                id="attackGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#fb7185"
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#fb7185"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              stroke="#263449"
                              strokeDasharray="3 5"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: "#8795ab", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fill: "#8795ab", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              width={25}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#101827",
                                border: "1px solid #30415a",
                                borderRadius: "8px",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="attacks"
                              name="Predicted attacks"
                              stroke="#fb7185"
                              strokeWidth={2}
                              fill="url(#attackGradient)"
                            />
                            <Area
                              type="monotone"
                              dataKey="detections"
                              name="All detections"
                              stroke="#2dd4bf"
                              strokeWidth={2}
                              fill="transparent"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="empty-chart">
                        <Activity size={28} />
                        <p>
                          More timestamped detections are needed to display a
                          timeline.
                        </p>
                      </div>
                    )}

                    <div className="chart-footnote">
                      <span>
                        <span className="legend-dot teal-dot" />
                        All detections
                      </span>
                      <span>
                        <span className="legend-dot red-dot" />
                        Predicted attacks
                      </span>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">LATEST ACTIVITY</span>
                      <h3>Recent detections</h3>
                      <p className="muted">
                        Select a record to inspect its prediction
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSeverityFilter("all");
                        setPage("Detections");
                      }}
                    >
                      Explore all <ChevronRight size={15} />
                    </button>
                  </div>
                  <DetectionTable
                    items={detections.slice(0, 5)}
                    onSelect={setSelectedDetection}
                    selectedId={selectedDetection?.id}
                  />
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">ALERT MANAGEMENT</span>
                      <h3>Recent alerts</h3>
                      <p className="muted">Alerts generated from predictions</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("Alerts")}
                    >
                      Open queue <ChevronRight size={15} />
                    </button>
                  </div>

                  {alerts.length ? (
                    <div className="alert-list">
                      {alerts.slice(0, 5).map((alert) => (
                        <div className="alert-card-row" key={alert.id}>
                          <div className="alert-leading-icon">
                            <AlertTriangle size={17} />
                          </div>
                          <div className="alert-summary">
                            <strong>{alert.title}</strong>
                            <p className="muted">
                              {alert.attack_category} · {alert.created_at}
                            </p>
                          </div>
                          <SeverityBadge severity={alert.severity} />
                          <span className="alert-status">
                            {alert.status || "open"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <ShieldCheck size={28} />
                      <strong>No alerts generated</strong>
                      <p className="muted">
                        Alerts appear when the model predicts an attack.
                      </p>
                    </div>
                  )}
                </section>
                <ExplainabilityPanel />
              </>
            )}

            {page === "Detections" && (
              <>
                <section className="metrics-grid compact-metrics">
                  <Metric
                    title="All records"
                    value={detections.length}
                    icon={Network}
                    color="teal"
                    subtitle="Loaded from API"
                  />
                  <Metric
                    title="Attacks"
                    value={detections.filter((item) => item.is_attack).length}
                    icon={AlertTriangle}
                    color="red"
                    subtitle="Model predictions"
                  />
                </section>

                <section className="panel page-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">TRAFFIC CLASSIFICATION</span>
                      <h3>Detection explorer</h3>
                      <p className="muted">
                        {filteredDetections.length} matching records
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSearch("");
                        setSeverityFilter("all");
                      }}
                    >
                      <Filter size={15} /> Reset filters
                    </button>
                  </div>

                  <SearchBox value={search} onChange={setSearch} />

                  <div className="filter-row">
                    {["all", "high", "medium", "low"].map((filter) => (
                      <button
                        key={filter}
                        className={`filter-button ${
                          severityFilter === filter ? "selected" : ""
                        }`}
                        onClick={() => setSeverityFilter(filter)}
                      >
                        {filter === "all"
                          ? "All severities"
                          : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  <DetectionTable
                    items={filteredDetections}
                    onSelect={setSelectedDetection}
                    selectedId={selectedDetection?.id}
                  />
                </section>
              </>
            )}

            {page === "Alerts" && (
              <section className="panel page-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">INCIDENT MANAGEMENT</span>
                    <h3>Alert queue</h3>
                    <p className="muted">
                      {filteredAlerts.length} alerts displayed
                    </p>
                  </div>
                  <button
                    className="refresh-button"
                    onClick={() => loadData()}
                    disabled={loading}
                  >
                    <RefreshCw size={15} /> Refresh
                  </button>
                </div>

                <div className="filter-row">
                  {["all", "open", "investigating", "resolved"].map((filter) => (
                    <button
                      key={filter}
                      className={`filter-button ${
                        alertFilter === filter ? "selected" : ""
                      }`}
                      onClick={() => setAlertFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredAlerts.length ? (
                  <div className="alert-list">
                    {filteredAlerts.map((alert) => (
                      <div className="alert-card-row full-alert" key={alert.id}>
                        <div className="alert-leading-icon">
                          <ShieldAlert size={18} />
                        </div>
                        <div className="alert-summary">
                          <strong>{alert.title}</strong>
                          <p className="muted">
                            {alert.attack_category} · Detection #
                            {alert.detection_id ?? "—"}
                          </p>
                          <p className="muted">
                            Probability:{" "}
                            {Number(alert.attack_probability * 100).toFixed(1)}
                            % · {alert.created_at}
                          </p>
                        </div>
                        
<div className="alert-meta">
  <SeverityBadge severity={alert.severity} />
  <span className="alert-status">
    {alert.status || "open"}
  </span>

  <div className="alert-actions">
    {(alert.status || "open") === "open" && (
      <button
        className="filter-button"
        onClick={() =>
          updateAlertStatus(alert.id, "investigating")
        }
      >
        Investigate
      </button>
    )}

    {alert.status === "investigating" && (
      <button
        className="filter-button"
        onClick={() =>
          updateAlertStatus(alert.id, "resolved")
        }
      >
        Resolve
      </button>
    )}

    {alert.status === "resolved" && (
      <button
        className="filter-button"
        onClick={() => updateAlertStatus(alert.id, "open")}
      >
        Reopen
      </button>
    )}
  </div>
</div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Eye size={28} />
                    <strong>No matching alerts</strong>
                    <p className="muted">
                      Try another status filter or refresh the alert queue.
                    </p>
                  </div>
                )}

                
              </section>
            )}
          </>
        )}
      </main>

      <InvestigationDrawer
        detection={selectedDetection}
        onClose={() => setSelectedDetection(null)}
      />
    </div>
  );
}

export default App;
