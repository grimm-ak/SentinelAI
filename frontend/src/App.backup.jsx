
import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";

function Metric({ title, value, icon: Icon, color }) {
  return (
    <div className="metric card">
      <div>
        <p className="muted">{title}</p>
        <h2>{value ?? "—"}</h2>
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
        placeholder="Search detections..."
      />
    </div>
  );
}

function DetectionTable({ items }) {
  if (!items.length) {
    return <p className="muted">No detections found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Result</th>
            <th>Category</th>
            <th>Probability</th>
            <th>Severity</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>#{item.id}</td>
              <td>{item.is_attack ? "Attack" : "Normal"}</td>
              <td>{item.attack_category}</td>
              <td>{(item.attack_probability * 100).toFixed(1)}%</td>
              <td>
                <span className={`severity ${item.severity}`}>
                  {item.severity}
                </span>
              </td>
              <td>{item.created_at}</td>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
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
    } catch {
      setError("Cannot connect to the backend. Make sure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDetections = detections.filter((item) =>
    [
      item.id,
      item.attack_category,
      item.severity,
      item.is_attack ? "attack" : "normal",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === "all") return true;
    return (alert.status || "open").toLowerCase() === alertFilter;
  });

  const severityData = Object.entries(
    dashboard?.attack_severity_breakdown || {}
  ).map(([name, value]) => ({ name, value }));

  const chartColors = ["#2dd4bf", "#f59e0b", "#f87171"];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h2>SentinelAI</h2>
            <p className="muted">AI Security Operations</p>
          </div>
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
          </button>
        ))}

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Detection API</span>
          <span className="muted">v1.0</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="muted">Security Operations Center</p>
            <h1>{page}</h1>
          </div>
          <button className="refresh-button" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {loading && !dashboard ? (
          <div className="panel page-panel">Loading SOC data...</div>
        ) : (
          <>
            {page === "Overview" && (
              <>
                <section className="metrics-grid">
                  <Metric
                    title="Total Detections"
                    value={dashboard?.total_detections ?? 0}
                    icon={Network}
                    color="teal"
                  />
                  <Metric
                    title="Predicted Attacks"
                    value={dashboard?.predicted_attacks ?? 0}
                    icon={AlertTriangle}
                    color="red"
                  />
                  <Metric
                    title="Predicted Normal"
                    value={dashboard?.predicted_normal ?? 0}
                    icon={ShieldCheck}
                    color="blue"
                  />
                  <Metric
                    title="Open Alerts"
                    value={dashboard?.open_alerts ?? 0}
                    icon={ShieldAlert}
                    color="orange"
                  />
                </section>

                <section className="content-grid">
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Attack Severity</h3>
                        <p className="muted">Predicted attack breakdown</p>
                      </div>
                      <CircleDot size={20} />
                    </div>

                    {severityData.length ? (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={severityData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={85}
                              innerRadius={55}
                              paddingAngle={4}
                            >
                              {severityData.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={chartColors[index % chartColors.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="muted">No severity data available yet.</p>
                    )}

                    <div className="legend">
                      {severityData.map((item, index) => (
                        <div className="legend-item" key={item.name}>
                          <span
                            className="legend-dot"
                            style={{
                              backgroundColor:
                                chartColors[index % chartColors.length],
                            }}
                          />
                          <span>{item.name}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Recent Alerts</h3>
                        <p className="muted">Latest generated alerts</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setPage("Alerts")}
                      >
                        View all
                      </button>
                    </div>

                    {alerts.length ? (
                      <div className="alert-list">
                        {alerts.slice(0, 5).map((alert) => (
                          <div className="alert-card-row" key={alert.id}>
                            <div>
                              <strong>{alert.title}</strong>
                              <p className="muted">
                                {alert.attack_category} · {alert.created_at}
                              </p>
                            </div>
                            <span
                              className={`severity ${(alert.severity || "medium").toLowerCase()}`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">No alerts generated yet.</p>
                    )}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Detections</h3>
                      <p className="muted">Latest traffic classifications</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("Detections")}
                    >
                      View all
                    </button>
                  </div>
                  <DetectionTable items={detections.slice(0, 5)} />
                </section>
              </>
            )}

            {page === "Detections" && (
              <section className="panel page-panel">
                <div className="panel-heading">
                  <div>
                    <h3>All Detections</h3>
                    <p className="muted">
                      {filteredDetections.length} records found
                    </p>
                  </div>
                </div>
                <SearchBox value={search} onChange={setSearch} />
                <DetectionTable items={filteredDetections} />
              </section>
            )}

            {page === "Alerts" && (
              <section className="panel page-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Security Alerts</h3>
                    <p className="muted">
                      {filteredAlerts.length} alerts shown
                    </p>
                  </div>
                </div>

                <div className="filter-row">
                  {["all", "open", "closed"].map((filter) => (
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
                      <div className="alert-card-row" key={alert.id}>
                        <div>
                          <strong>{alert.title}</strong>
                          <p className="muted">
                            {alert.attack_category} ·{" "}
                            {Number(alert.attack_probability * 100).toFixed(1)}%
                            probability · {alert.created_at}
                          </p>
                          <p className="muted">Status: {alert.status}</p>
                        </div>
                        <span
                          className={`severity ${(alert.severity || "medium").toLowerCase()}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No alerts match this filter.</p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
