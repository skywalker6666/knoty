import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg: "#08080e", card: "#111119", border: "#1e1e2e",
  accent: "#7c6cf0", warm: "#ff6b8a", cool: "#2dd4c0",
  gold: "#f0c040", danger: "#e05545",
  text: "#e8e8f4", dim: "#7a7a99", muted: "#3a3a55",
};
const REL = {
  5: { tag: "超熟", color: C.accent, w: 3, dash: "" },
  4: { tag: "不錯", color: C.cool, w: 2.5, dash: "" },
  3: { tag: "普通", color: C.muted, w: 1.5, dash: "5,5" },
  2: { tag: "不太熟", color: C.gold, w: 1.5, dash: "3,5" },
  1: { tag: "有嫌隙", color: C.danger, w: 2, dash: "2,4" },
};
const CIR = { "社團": C.accent, "宿舍": C.cool, "班上": C.warm, "打工": C.gold };
const CENTER_COLORS = [C.accent, C.warm, C.cool];

const ppl = [
  { id: "a", n: "社團學姐", e: "👩‍🎓", c: "社團" },
  { id: "b", n: "室友阿胖", e: "🎮", c: "宿舍" },
  { id: "c", n: "班代", e: "📋", c: "班上" },
  { id: "d", n: "社團副社", e: "🎸", c: "社團" },
  { id: "e", n: "報告組員A", e: "📚", c: "班上" },
  { id: "f", n: "隔壁室友", e: "🎧", c: "宿舍" },
  { id: "g", n: "社團學弟", e: "🐣", c: "社團" },
  { id: "h", n: "打工同事", e: "☕", c: "打工" },
];

const myR = [
  { to: "a", cl: 5, lb: "罩我的學姐" }, { to: "b", cl: 5, lb: "最好的室友" },
  { to: "c", cl: 3, lb: "公事往來" }, { to: "d", cl: 2, lb: "有點競爭" },
  { to: "e", cl: 4, lb: "報告好夥伴" }, { to: "f", cl: 3, lb: "點頭之交" },
  { to: "g", cl: 4, lb: "照顧的學弟" }, { to: "h", cl: 4, lb: "一起上班" },
];

const oR = [
  { a: "a", b: "d", cl: 1, lb: "不合" }, { a: "a", b: "g", cl: 4, lb: "學姐帶學弟" },
  { a: "b", b: "f", cl: 4, lb: "常一起打球" }, { a: "b", b: "h", cl: 3, lb: "認識" },
  { a: "c", b: "e", cl: 4, lb: "班上搭檔" }, { a: "c", b: "d", cl: 5, lb: "超好" },
  { a: "d", b: "g", cl: 2, lb: "學弟怕他" }, { a: "e", b: "f", cl: 3, lb: "同堂課" },
];

function getConnected(id) {
  const s = new Set();
  if (id === "me") {
    myR.forEach(r => s.add(r.to));
  } else {
    s.add(id);
    oR.forEach(r => { if (r.a === id) s.add(r.b); if (r.b === id) s.add(r.a); });
    myR.forEach(r => { if (r.to === id) s.add("me"); });
  }
  return s;
}

function getRel(idA, idB) {
  if (idA === "me") return myR.find(r => r.to === idB);
  if (idB === "me") return myR.find(r => r.to === idA);
  const found = oR.find(r => (r.a === idA && r.b === idB) || (r.a === idB && r.b === idA));
  return found ? { cl: found.cl, lb: found.lb } : null;
}

function layoutSingle(sel, w, h) {
  const cx = w / 2, cy = h / 2, pos = {};
  if (!sel) {
    pos.me = { x: cx, y: cy };
    const r = Math.min(w, h) * 0.34;
    ppl.forEach((p, i) => {
      const a = (i / ppl.length) * Math.PI * 2 - Math.PI / 2;
      pos[p.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
    return pos;
  }
  const conn = new Set();
  oR.forEach(r => { if (r.a === sel) conn.add(r.b); if (r.b === sel) conn.add(r.a); });
  pos.me = { x: cx * 0.55, y: cy };
  pos[sel] = { x: cx * 1.3, y: cy };
  const cp = ppl.filter(p => p.id !== sel && conn.has(p.id));
  const op = ppl.filter(p => p.id !== sel && !conn.has(p.id));
  const ir = Math.min(w, h) * 0.24;
  cp.forEach((p, i) => {
    const sp = Math.min(Math.PI * 1.4, cp.length * 0.55);
    const sa = -sp / 2;
    const a = sa + (cp.length > 1 ? (i / (cp.length - 1)) * sp : 0);
    pos[p.id] = { x: cx * 1.3 + Math.cos(a) * ir, y: cy + Math.sin(a) * ir };
  });
  const or2 = Math.min(w, h) * 0.4;
  op.forEach((p, i) => {
    const a = Math.PI * 0.7 + (i / Math.max(op.length - 1, 1)) * Math.PI * 0.6;
    pos[p.id] = { x: cx + Math.cos(a) * or2, y: cy + Math.sin(a) * or2 };
  });
  return pos;
}

function layoutMulti(centers, w, h) {
  const cx = w / 2, cy = h / 2, pos = {};
  const allConn = new Set();
  centers.forEach(c => { getConnected(c).forEach(x => allConn.add(x)); allConn.add(c); });

  const sharedBy = {};
  ppl.forEach(p => {
    if (centers.includes(p.id)) return;
    const connTo = centers.filter(c => {
      if (c === "me") return myR.some(r => r.to === p.id);
      return oR.some(r => (r.a === c && r.b === p.id) || (r.a === p.id && r.b === c));
    });
    sharedBy[p.id] = connTo;
  });

  if (centers.length === 2) {
    const [cA, cB] = centers;
    const gap = w * 0.32;
    pos[cA] = { x: cx - gap / 2, y: cy };
    pos[cB] = { x: cx + gap / 2, y: cy };

    const left = [], mid = [], right = [];
    ppl.forEach(p => {
      if (centers.includes(p.id)) return;
      const s = sharedBy[p.id] || [];
      if (s.length >= 2) mid.push(p);
      else if (s.includes(cA) || (cA === "me" && myR.some(r => r.to === p.id))) left.push(p);
      else if (s.includes(cB) || (cB === "me" && myR.some(r => r.to === p.id))) right.push(p);
      else mid.push(p);
    });

    const spreadY = (arr, baseX, startY, spacing) => {
      const totalH = (arr.length - 1) * spacing;
      arr.forEach((p, i) => {
        pos[p.id] = { x: baseX, y: startY - totalH / 2 + i * spacing };
      });
    };
    spreadY(left, cx - gap / 2 - w * 0.2, cy, 65);
    spreadY(mid, cx, cy - 20, 55);
    spreadY(right, cx + gap / 2 + w * 0.2, cy, 65);

  } else {
    const r = Math.min(w, h) * 0.15;
    centers.forEach((c, i) => {
      const a = (i / centers.length) * Math.PI * 2 - Math.PI / 2;
      pos[c] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
    const outerR = Math.min(w, h) * 0.38;
    const nonCenters = ppl.filter(p => !centers.includes(p.id));
    nonCenters.forEach((p, i) => {
      const conns = sharedBy[p.id] || [];
      let targetX = cx, targetY = cy;
      if (conns.length === 1 && pos[conns[0]]) {
        const cp = pos[conns[0]];
        const dx = cp.x - cx, dy = cp.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        targetX = cp.x + (dx / dist) * outerR * 0.6;
        targetY = cp.y + (dy / dist) * outerR * 0.6;
      } else if (conns.length >= 2) {
        targetX = cx;
        targetY = cy;
      } else {
        const a = Math.PI * 0.8 + (i / Math.max(nonCenters.length - 1, 1)) * Math.PI * 0.4;
        targetX = cx + Math.cos(a) * outerR;
        targetY = cy + Math.sin(a) * outerR;
      }
      const jitter = (Math.random() - 0.5) * 30;
      pos[p.id] = { x: targetX + jitter, y: targetY + jitter };
    });
  }
  return pos;
}

function Edge({ x1, y1, x2, y2, cl, show, label }) {
  const r = REL[cl];
  return (
    <g opacity={show ? 0.9 : 0.1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={r.color} strokeWidth={show ? r.w : 0.8}
        strokeDasharray={r.dash} strokeLinecap="round" />
      {show && label && (() => {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const tw = label.length * 9 + 10;
        return (
          <g>
            <rect x={mx - tw / 2} y={my - 18} width={tw} height={16} rx={8}
              fill={C.card} stroke={r.color} strokeWidth={0.7} opacity={0.95} />
            <text x={mx} y={my - 8} textAnchor="middle" fill={r.color}
              fontSize={9} fontFamily="'Noto Sans TC',sans-serif">{label}</text>
          </g>
        );
      })()}
    </g>
  );
}

function Nd({ id, name, emoji, circle, x, y, active, isCenter, centerIdx, isMe, onTap, onLong, faded }) {
  const sz = isMe ? 28 : isCenter ? 26 : 22;
  const cc = isCenter ? CENTER_COLORS[centerIdx] || C.accent : CIR[circle] || C.dim;
  const timerRef = useRef(null);

  const handleDown = () => {
    timerRef.current = setTimeout(() => { onLong(id); timerRef.current = null; }, 500);
  };
  const handleUp = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; onTap(id); }
  };
  const handleLeave = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }} opacity={faded ? 0.2 : 1}
      onPointerDown={handleDown} onPointerUp={handleUp} onPointerLeave={handleLeave}>
      {isCenter && (
        <circle r={sz + 8} fill="none" stroke={cc} strokeWidth={2} opacity={0.5}>
          <animate attributeName="r" values={`${sz + 6};${sz + 12};${sz + 6}`} dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={sz} fill={C.card} stroke={isCenter ? cc : active ? C.dim : C.border}
        strokeWidth={isCenter ? 2.5 : 1.2} />
      <text y={1} textAnchor="middle" fontSize={isMe ? 20 : 15} dominantBaseline="central">{emoji}</text>
      <text y={sz + 14} textAnchor="middle" fill={isCenter || active ? C.text : C.dim}
        fontSize={10} fontWeight={isCenter ? 700 : 400}
        fontFamily="'Noto Sans TC',sans-serif">{name}</text>
      {!isMe && !isCenter && (
        <text y={sz + 26} textAnchor="middle" fill={CIR[circle] || C.dim} fontSize={8}
          fontFamily="'Noto Sans TC',sans-serif" opacity={0.6}>{circle}</text>
      )}
      {isCenter && !isMe && (
        <rect x={-12} y={-sz - 14} width={24} height={14} rx={7} fill={cc} opacity={0.25} />
      )}
      {isCenter && !isMe && (
        <text y={-sz - 5} textAnchor="middle" fill={cc} fontSize={8}
          fontFamily="'Noto Sans TC',sans-serif">中心</text>
      )}
    </g>
  );
}

function Panel({ centers, onClose }) {
  if (centers.length === 0) return null;
  const isSingle = centers.length === 1 && centers[0] !== "me";
  const isMulti = centers.length >= 2;
  if (!isSingle && !isMulti) return null;

  if (isSingle) {
    const sel = centers[0];
    const p = ppl.find(x => x.id === sel);
    const mr = myR.find(x => x.to === sel);
    const rc = REL[mr.cl];
    const rels = oR.filter(r => r.a === sel || r.b === sel);
    const risk = rels.find(r => r.cl <= 2);
    let riskTxt = null;
    if (risk) {
      const oid = risk.a === sel ? risk.b : risk.a;
      const o = ppl.find(x => x.id === oid);
      riskTxt = `${p.n}跟${o.n}${risk.lb}，在${o.n}面前聊到${p.n}要小心`;
    }
    return (
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: C.card, borderTop: `1px solid ${C.border}`,
        borderRadius: "16px 16px 0 0", padding: "14px 14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>{p.e}</span>
            <div>
              <span style={{ color: C.text, fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans TC',sans-serif" }}>{p.n}</span>
              <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 6, fontSize: 9,
                background: rc.color + "20", color: rc.color, fontFamily: "'Noto Sans TC',sans-serif" }}>
                {rc.tag} · {mr.lb}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`,
            color: C.dim, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10 }}>✕</button>
        </div>
        {rels.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
            {rels.map(r => {
              const oid = r.a === sel ? r.b : r.a;
              const o = ppl.find(x => x.id === oid);
              const rr = REL[r.cl];
              return (
                <span key={oid} style={{ display: "inline-flex", alignItems: "center", gap: 3,
                  padding: "2px 7px", borderRadius: 8, background: rr.color + "12",
                  border: `1px solid ${rr.color}20`, fontSize: 9, color: C.text,
                  fontFamily: "'Noto Sans TC',sans-serif" }}>
                  {o.e} {o.n} <span style={{ color: rr.color }}>{r.lb}</span>
                </span>
              );
            })}
          </div>
        )}
        {riskTxt && (
          <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 8,
            background: C.danger + "12", border: `1px solid ${C.danger}20` }}>
            <span style={{ color: C.danger, fontSize: 10, fontWeight: 600, fontFamily: "'Noto Sans TC',sans-serif" }}>⚠️ </span>
            <span style={{ color: C.dim, fontSize: 9, lineHeight: 1.5, fontFamily: "'Noto Sans TC',sans-serif" }}>{riskTxt}</span>
          </div>
        )}
        <div style={{ color: C.muted, fontSize: 9, marginTop: 8, textAlign: "center", fontFamily: "'Noto Sans TC',sans-serif" }}>
          💡 長按其他人可加入多中心比較（最多 3 人）
        </div>
      </div>
    );
  }

  const centerPeople = centers.map(c => c === "me" ? { id: "me", n: "我", e: "😎" } : ppl.find(x => x.id === c));
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
      background: C.card, borderTop: `1px solid ${C.border}`,
      borderRadius: "16px 16px 0 0", padding: "14px 14px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {centerPeople.map((p, i) => (
            <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 10, background: CENTER_COLORS[i] + "20",
              border: `1px solid ${CENTER_COLORS[i]}40`, fontSize: 11, color: C.text,
              fontFamily: "'Noto Sans TC',sans-serif" }}>
              {p.e} {p.n}
            </span>
          ))}
          <span style={{ color: C.dim, fontSize: 10, fontFamily: "'Noto Sans TC',sans-serif" }}>比較模式</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`,
          color: C.dim, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10 }}>✕</button>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
        {centers.flatMap((c, ci) => {
          const otherCenters = centers.filter(x => x !== c);
          return otherCenters.map(oc => {
            const rel = getRel(c, oc);
            if (!rel) return null;
            const cn = c === "me" ? "我" : ppl.find(x => x.id === c)?.n;
            const on = oc === "me" ? "我" : ppl.find(x => x.id === oc)?.n;
            const rc = REL[rel.cl];
            return (
              <span key={`${c}-${oc}`} style={{ display: "inline-flex", alignItems: "center", gap: 3,
                padding: "2px 7px", borderRadius: 8, background: rc.color + "12",
                border: `1px solid ${rc.color}20`, fontSize: 9, color: C.text,
                fontFamily: "'Noto Sans TC',sans-serif" }}>
                {cn} ↔ {on} <span style={{ color: rc.color }}>{rc.tag} · {rel.lb}</span>
              </span>
            );
          }).filter(Boolean);
        })}
      </div>
      <div style={{ color: C.muted, fontSize: 9, marginTop: 8, textAlign: "center", fontFamily: "'Noto Sans TC',sans-serif" }}>
        中間 = 共同認識 · 兩側 = 各自的人
      </div>
    </div>
  );
}

export default function KnotyV3() {
  const [centers, setCenters] = useState([]);
  const ref = useRef(null);
  const [dim, setDim] = useState({ w: 380, h: 650 });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const m = () => { if (ref.current) { const r = ref.current.getBoundingClientRect(); setDim({ w: r.width, h: r.height }); } };
    m(); window.addEventListener("resize", m); return () => window.removeEventListener("resize", m);
  }, []);

  const panelH = centers.length === 1 && centers[0] !== "me" ? 170 : centers.length >= 2 ? 130 : 0;
  const svgH = dim.h - panelH;

  const pos = centers.length >= 2
    ? layoutMulti(centers, dim.w, svgH)
    : layoutSingle(centers[0] || null, dim.w, svgH);

  const tap = useCallback(id => {
    setCenters(prev => {
      if (prev.length >= 2) return [id];
      if (prev[0] === id) return [];
      return [id];
    });
  }, []);

  const longPress = useCallback(id => {
    setCenters(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        setToast("最多 3 個中心節點");
        setTimeout(() => setToast(null), 1500);
        return prev;
      }
      if (prev.length === 0) return [id];
      return [...prev, id];
    });
  }, []);

  const activeSet = new Set();
  centers.forEach(c => { activeSet.add(c); getConnected(c).forEach(x => activeSet.add(x)); });

  const edges = [];
  const isMulti = centers.length >= 2;

  myR.forEach(r => {
    if (!pos.me || !pos[r.to]) return;
    const show = centers.length === 0 || activeSet.has(r.to);
    const showLabel = (centers.length === 1 && r.to === centers[0]) || isMulti;
    edges.push(<Edge key={`m-${r.to}`} x1={pos.me.x} y1={pos.me.y} x2={pos[r.to].x} y2={pos[r.to].y}
      cl={r.cl} show={show} label={showLabel ? r.lb : null} />);
  });

  if (centers.length >= 1) {
    centers.forEach(c => {
      if (c === "me") return;
      oR.filter(r => r.a === c || r.b === c).forEach(r => {
        if (pos[r.a] && pos[r.b]) {
          edges.push(<Edge key={`o-${r.a}-${r.b}`} x1={pos[r.a].x} y1={pos[r.a].y}
            x2={pos[r.b].x} y2={pos[r.b].y} cl={r.cl} show={true} label={r.lb} />);
        }
      });
    });
  }

  if (isMulti) {
    centers.forEach((cA, i) => {
      centers.slice(i + 1).forEach(cB => {
        const rel = getRel(cA, cB);
        if (rel && pos[cA] && pos[cB]) {
          edges.push(<Edge key={`cc-${cA}-${cB}`} x1={pos[cA].x} y1={pos[cA].y}
            x2={pos[cB].x} y2={pos[cB].y} cl={rel.cl} show={true} label={rel.lb} />);
        }
      });
    });
  }

  return (
    <div ref={ref} style={{ width: "100%", height: "100vh", background: C.bg,
      position: "relative", overflow: "hidden", fontFamily: "'Noto Sans TC',-apple-system,sans-serif",
      touchAction: "none", userSelect: "none" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <div style={{ position: "absolute", top: 10, left: 14, zIndex: 5, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.accent, letterSpacing: 1 }}>Knoty</span>
        <span style={{ fontSize: 8, color: C.muted, padding: "1px 5px", border: `1px solid ${C.border}`, borderRadius: 4 }}>DEMO</span>
      </div>

      <div style={{ position: "absolute", top: 8, right: 10, zIndex: 5,
        background: C.card + "dd", border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "5px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {[5, 4, 3, 2, 1].map(lv => (
          <div key={lv} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width={16} height={5}><line x1={0} y1={2.5} x2={16} y2={2.5}
              stroke={REL[lv].color} strokeWidth={REL[lv].w} strokeDasharray={REL[lv].dash} strokeLinecap="round" /></svg>
            <span style={{ color: REL[lv].color, fontSize: 7 }}>{REL[lv].tag}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center", zIndex: 5,
        color: C.muted, fontSize: 10, fontFamily: "'Noto Sans TC',sans-serif" }}>
        {centers.length === 0 && "點擊查看關係 · 長按加入多中心比較"}
        {centers.length === 1 && centers[0] === "me" && "按圈子分群 · 點擊或長按其他人"}
        {centers.length === 1 && centers[0] !== "me" && "展開關係中 · 長按其他人加入比較"}
        {centers.length >= 2 && `${centers.length} 中心比較模式 · 點擊空白處重置`}
      </div>

      {toast && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: "8px 16px", color: C.text, fontSize: 12, fontFamily: "'Noto Sans TC',sans-serif" }}>
          {toast}
        </div>
      )}

      <svg width={dim.w} height={svgH} style={{ position: "absolute", top: 0, left: 0 }}
        onClick={e => { if (e.target.tagName === "svg") setCenters([]); }}>
        {edges}
        {pos.me && (
          <Nd id="me" name="我" emoji="😎" circle="中心" x={pos.me.x} y={pos.me.y}
            active={true} isCenter={centers.includes("me")} centerIdx={centers.indexOf("me")}
            isMe onTap={tap} onLong={longPress} faded={false} />
        )}
        {ppl.map(p => {
          const pp = pos[p.id];
          if (!pp) return null;
          const faded = centers.length > 0 && !activeSet.has(p.id);
          const isCtr = centers.includes(p.id);
          return (
            <Nd key={p.id} id={p.id} name={p.n} emoji={p.e} circle={p.c}
              x={pp.x} y={pp.y} active={activeSet.has(p.id)}
              isCenter={isCtr} centerIdx={centers.indexOf(p.id)}
              isMe={false} onTap={tap} onLong={longPress} faded={faded} />
          );
        })}
      </svg>

      <Panel centers={centers} onClose={() => setCenters([])} />
    </div>
  );
}
