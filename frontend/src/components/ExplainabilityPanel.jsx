
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { BrainCircuit, RefreshCw, Info } from "lucide-react";
import "./ExplainabilityPanel.css";

const API = "http://localhost:8000";




function FeatureAxisTick({ x, y, payload }) {
  const info = describeFeature(payload.value);

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{`${info.name}: ${info.description}`}</title>

      <text
        x={-8}
        y={4}
        textAnchor="end"
        fill="var(--text)"
        fontSize={11}
      >
        {info.original}
      </text>

      <circle
        cx={-3}
        cy={0}
        r={5.5}
        fill="var(--panel-hover)"
        stroke="var(--teal)"
        strokeWidth={0.8}
      />

      <text
        x={-3}
        y={3}
        textAnchor="middle"
        fill="var(--teal)"
        fontSize={8}
        fontWeight="bold"
      >
        i
      </text>
    </g>
  );
}




const FEATURE_INFO = {
  dur: {
    name: "Connection duration",
    description: "How long the network connection lasted, in seconds.",
  },
  proto: {
    name: "Protocol",
    description: "The network protocol used, such as TCP, UDP, or a routing protocol.",
  },
  service: {
    name: "Network service",
    description: "The service associated with the traffic, such as HTTP, DNS, or FTP.",
  },
  state: {
    name: "Connection state",
    description: "The recorded state of the network connection.",
  },
  spkts: {
    name: "Source packets",
    description: "Number of packets sent from the source to the destination.",
  },
  dpkts: {
    name: "Destination packets",
    description: "Number of packets sent from the destination back to the source.",
  },
  sbytes: {
    name: "Source bytes",
    description: "Total bytes sent by the source.",
  },
  dbytes: {
    name: "Destination bytes",
    description: "Total bytes sent by the destination.",
  },
  rate: {
    name: "Connection rate",
    description: "The traffic rate recorded for the connection.",
  },
  sload: {
    name: "Source data rate",
    description: "Rate of data sent by the source, measured in bits per second.",
  },
  dload: {
    name: "Destination data rate",
    description: "Rate of data sent by the destination, measured in bits per second.",
  },
  sloss: {
    name: "Source packet loss",
    description: "Number of packets lost on the source-to-destination direction.",
  },
  dloss: {
    name: "Destination packet loss",
    description: "Number of packets lost on the destination-to-source direction.",
  },
  sinpkt: {
    name: "Source inter-packet time",
    description: "Average time between consecutive packets from the source.",
  },
  dinpkt: {
    name: "Destination inter-packet time",
    description: "Average time between consecutive packets from the destination.",
  },
  sjit: {
    name: "Source jitter",
    description: "Variation in packet timing from the source.",
  },
  djit: {
    name: "Destination jitter",
    description: "Variation in packet timing from the destination.",
  },
  swin: {
    name: "Source TCP window",
    description: "TCP window size advertised by the source.",
  },
  stcpb: {
    name: "Source TCP sequence data",
    description: "TCP sequence-related value recorded for the source.",
  },
  dtcpb: {
    name: "Destination TCP sequence data",
    description: "TCP sequence-related value recorded for the destination.",
  },
  dwin: {
    name: "Destination TCP window",
    description: "TCP window size advertised by the destination.",
  },
  tcprtt: {
    name: "TCP round-trip time",
    description: "Measured time for TCP communication to travel to the peer and back.",
  },
  synack: {
    name: "SYN-to-ACK time",
    description: "Timing associated with the TCP SYN and SYN-ACK handshake.",
  },
  ackdat: {
    name: "ACK-to-data time",
    description: "Timing associated with TCP acknowledgement and data transfer.",
  },
  smean: {
    name: "Average source packet size",
    description: "Mean size of packets sent by the source, in bytes.",
  },
  dmean: {
    name: "Average destination packet size",
    description: "Mean size of packets sent by the destination, in bytes.",
  },
  trans_depth: {
    name: "Transaction depth",
    description: "Depth of the recorded protocol transaction, where applicable.",
  },
  response_body_len: {
    name: "Response body length",
    description: "Length of the recorded response body, where applicable.",
  },
  ct_src_dport_ltm: {
    name: "Recent source-to-port connections",
    description: "Count of recent connections from the source to the same destination port.",
  },
  ct_dst_sport_ltm: {
    name: "Recent destination-port activity",
    description: "Count of recent connections associated with the destination and source port.",
  },
  is_ftp_login: {
    name: "FTP login indicator",
    description: "Indicates whether an FTP login was recorded.",
  },
  ct_ftp_cmd: {
    name: "FTP command count",
    description: "Count of FTP commands recorded for the traffic.",
  },
  ct_flw_http_mthd: {
    name: "HTTP method count",
    description: "Count of HTTP methods recorded for the traffic.",
  },
  is_sm_ips_ports: {
    name: "Same IP and port indicator",
    description: "Indicates whether the source and destination IP/port values match according to the dataset's definition.",
  },
};

function describeFeature(feature) {
  const original = feature.replace(/^(numerical|categorical)__/, "");

  if (FEATURE_INFO[original]) {
    return {
      ...FEATURE_INFO[original],
      original,
    };
  }

  // Encoded categorical features, such as categorical__proto_tcp
  for (const category of ["proto", "service", "state"]) {
    const prefix = `${category}_`;

    if (original.startsWith(prefix)) {
      const value = original.slice(prefix.length);
      const info = FEATURE_INFO[category];

      return {
        name: `${info.name}: ${value}`,
        description: `${info.description} This feature represents the category "${value}".`,
        original,
      };
    }
  }

  return {
    name: original,
    description: "A transformed model input feature from the network traffic dataset.",
    original,
  };
}


export default function ExplainabilityPanel() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadExplainability() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/explainability`);

      if (!response.ok) {
        throw new Error("Could not load feature importance.");
      }

      const data = await response.json();
      setFeatures(data.features || []);
    } catch {
      setError("Unable to connect to the explainability API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExplainability();
  }, []);


const chartData = features.map((item) => {
  const info = describeFeature(item.feature);

  return {
    ...item,
    label: info.original,
    displayName: info.name,
    description: info.description,
    percentage: item.importance * 100,
  };
});

  return (
    <section className="panel explainability-panel">
      <div className="explainability-header">
        <div className="explainability-title">
          <span className="explainability-icon">
            <BrainCircuit size={20} />
          </span>
          <div>
            <span className="eyebrow">MACHINE LEARNING</span>
            <h3>Model Explainability</h3>
            <p className="muted">
              Features the classifier relies on most
            </p>
          </div>
        </div>

        <button
          className="refresh-button"
          onClick={loadExplainability}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="muted explainability-message">
          Loading feature importance...
        </p>
      ) : error ? (
        <div className="explainability-error">
          <p>{error}</p>
          <button className="filter-button" onClick={loadExplainability}>
            Retry
          </button>
        </div>
      ) : features.length === 0 ? (
        <p className="muted explainability-message">
          No feature-importance data is available.
        </p>
      ) : (
        <>
          <div className="explainability-chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                accessibilityLayer={false}
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 24, bottom: 5, left: 12 }}
              >
                <CartesianGrid
                  stroke="#26374d"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, "auto"]}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  stroke="#8193aa"
                  tick={{ fontSize: 11 }}
                />
               

<YAxis
  type="category"
  dataKey="label"
  width={155}
  tick={<FeatureAxisTick />}
  tickLine={false}
  axisLine={false}
  interval={0}
/>




<Tooltip
  cursor={{ fill: "var(--panel-hover)" }}
  contentStyle={{
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--text)",
    padding: "12px",
    maxWidth: "300px",
  }}
  labelFormatter={(label) => {
    const feature = chartData.find(
      (item) => item.label === label
    );
    return feature?.displayName || label;
  }}
  formatter={(value) => [
    `${(Number(value)).toFixed(2)}%`,
    "Global importance",
  ]}
  content={({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const feature = chartData.find(
      (item) => item.label === label
    );

    if (!feature) return null;

    return (
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 14,
          maxWidth: 300,
          color: "var(--text)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <strong>{feature.displayName}</strong>

        <p
          style={{
            margin: "8px 0",
            color: "var(--muted)",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {feature.description}
        </p>

        <div style={{ color: "var(--teal)", fontSize: 12 }}>
          Global importance:{" "}
          {(Number(payload[0].value)).toFixed(2)}%
        </div>
      </div>
    );
  }}
/>


                <Bar
                  dataKey="percentage"
                  fill="#2dd4bf"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="explainability-note">
            <Info size={17} />
            <p>
              These scores show global Random Forest feature importance.
              They describe overall model behavior, not the cause of an
              individual detection.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
