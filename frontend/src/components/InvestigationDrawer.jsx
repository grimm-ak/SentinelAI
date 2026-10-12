
import { X, ShieldAlert, ShieldCheck, Clock, Activity } from "lucide-react";
import "./InvestigationDrawer.css";

function SeverityBadge({ severity }) {
  const level = (severity || "low").toLowerCase();

  return (
    <span className={`investigation-severity ${level}`}>
      <span className="severity-dot" />
      {level}
    </span>
  );
}

export default function InvestigationDrawer({ detection, onClose }) {
  if (!detection) return null;

  const isAttack = Boolean(detection.is_attack);
  const probability = Number(detection.attack_probability || 0);

  return (
    <div className="investigation-backdrop" onClick={onClose}>
      <aside
        className="investigation-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="investigation-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="investigation-header">
          <div>
            <p className="investigation-eyebrow">SECURITY INVESTIGATION</p>
            <h2 id="investigation-title">DET-{detection.id}</h2>
          </div>

          <button
            type="button"
            className="investigation-close"
            onClick={onClose}
            aria-label="Close investigation"
          >
            <X size={20} />
          </button>
        </header>

        <section className="investigation-result">
          <div className={`investigation-result-icon ${isAttack ? "attack" : "normal"}`}>
            {isAttack ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
          </div>

          <div>
            <h3>{isAttack ? "Potential attack detected" : "Normal traffic prediction"}</h3>
            <p>
              {isAttack
                ? "The model classified this traffic as a potential attack."
                : "The model classified this traffic as normal."}
            </p>
          </div>
        </section>

        <section className="investigation-section">
          <h3>Prediction details</h3>

          <div className="investigation-grid">
            <div className="investigation-detail">
              <span>Attack category</span>
              <strong>{detection.attack_category || "Unknown"}</strong>
            </div>

            <div className="investigation-detail">
              <span>Severity</span>
              <SeverityBadge severity={detection.severity} />
            </div>

            <div className="investigation-detail">
              <span>Attack probability</span>
              <strong>{(probability * 100).toFixed(2)}%</strong>
            </div>

            <div className="investigation-detail">
              <span>Detection ID</span>
              <strong>#{detection.id}</strong>
            </div>
          </div>

          <div className="investigation-confidence">
            <div>
              <span>Model probability</span>
              <strong>{(probability * 100).toFixed(1)}%</strong>
            </div>
            <div className="investigation-progress">
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, probability * 100))}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="investigation-section">
          <h3>Detection timeline</h3>

          <div className="investigation-event">
            <span className="investigation-event-icon">
              <Activity size={16} />
            </span>
            <div>
              <strong>Traffic classified</strong>
              <p>The ML model produced this prediction.</p>
            </div>
          </div>

          <div className="investigation-event">
            <span className="investigation-event-icon">
              <Clock size={16} />
            </span>
            <div>
              <strong>Record timestamp</strong>
              <p>{detection.created_at || "Timestamp unavailable"}</p>
            </div>
          </div>
        </section>

        <div className="investigation-notice">
          <ShieldAlert size={18} />
          <p>
            A model prediction is not a confirmed incident. Review the underlying
            traffic and additional evidence before deciding on a response.
          </p>
        </div>
      </aside>
    </div>
  );
}

