// ---------- Splash ----------
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("splash").style.display = "none";
    document.getElementById("app").style.display = "block";
    setView("view-dashboard");
  }, 3000);//3 seconds
});

// ---------- Routing (simple SPA) ----------
const viewTitle = document.getElementById("viewTitle");
const backBtn = document.getElementById("backBtn");
const views = ["view-dashboard","view-risk","view-sltp","view-rr"];

function setView(id){
  views.forEach(v => document.getElementById(v)?.classList.add("hidden"));
  document.getElementById(id)?.classList.remove("hidden");
  viewTitle.textContent =
    id==="view-dashboard" ? "TradeGuard Dashboard" :
    id==="view-risk" ? "Risk & Position Size" :
    id==="view-sltp" ? "SL/TP from Entry" :
    "Risk–Reward Calculator";

  // show back button only off dashboard
  if(id==="view-dashboard"){ backBtn.classList.add("hidden"); }
  else { backBtn.classList.remove("hidden"); }
}

document.querySelectorAll(".card[data-goto]").forEach(btn=>{
  btn.addEventListener("click", ()=> setView(btn.dataset.goto));
});
backBtn.addEventListener("click", ()=> setView("view-dashboard"));

// ---------- Helpers ----------
const toNum = v => Number.parseFloat(v);
function fmt(n, dp=2){ return isFinite(n) ? n.toFixed(dp) : "—"; }

// ---------- Risk & Position Size ----------
document.getElementById("form-risk").addEventListener("submit", (e)=>{
  e.preventDefault();
  const balance   = toNum(document.getElementById("r-balance").value);
  const riskPct   = toNum(document.getElementById("r-riskpct").value);
  const entry     = toNum(document.getElementById("r-entry").value);
  const slPrice   = toNum(document.getElementById("r-slprice").value);
  const rr        = toNum(document.getElementById("r-rr").value || "0");
  const pipSize   = toNum(document.getElementById("r-pipsize").value);
  const pipValLot = toNum(document.getElementById("r-pipvalue").value); // $/pip for 1.00 lot
  const dir       = document.getElementById("r-direction").value; // buy/sell

  if([balance,riskPct,entry,slPrice,pipSize,pipValLot].some(x=>!isFinite(x))){
    return alert("Please fill all required fields correctly.");
  }

  const riskAmount = balance * (riskPct/100);
  const slPips = Math.abs(entry - slPrice) / pipSize; // pip distance
  const lotSize = slPips === 0 ? 0 : (riskAmount / (slPips * pipValLot));

  // Suggest TP price using R multiple
  let tpPrice = null;
  if(rr && isFinite(rr) && slPips>0){
    const tpPips = slPips * rr;
    const delta = tpPips * pipSize;
    tpPrice = dir==="buy" ? entry + delta : entry - delta;
  }

  document.getElementById("r-result").innerHTML = `
    <p><b>Risk Amount:</b> $${fmt(riskAmount,2)}</p>
    <p><b>SL Distance:</b> ${fmt(slPips,1)} pips</p>
    <p><b>Recommended Lot Size:</b> ${fmt(lotSize,2)} lots</p>
    ${tpPrice!==null ? `<p><b>Suggested TP Price (R=${fmt(rr,2)}):</b> ${fmt(tpPrice,5)}</p>` : ``}
    <p class="muted">Assumes $/pip per 1.00 lot = ${pipValLot}. Adjust pip size/value for your instrument.</p>
  `;
});

// ---------- SL/TP from Entry ----------
document.getElementById("form-sltp").addEventListener("submit",(e)=>{
  e.preventDefault();
  const dir     = document.getElementById("st-direction").value;
  const pipSize = toNum(document.getElementById("st-pipsize").value);
  const entry   = toNum(document.getElementById("st-entry").value);
  const slPips  = toNum(document.getElementById("st-slpips").value);
  const rr      = toNum(document.getElementById("st-rr").value);

  if([pipSize,entry,slPips,rr].some(x=>!isFinite(x))) return alert("Please fill all fields.");

  const slDelta = slPips * pipSize;
  const tpDelta = slPips * rr * pipSize;

  const slPrice = dir==="buy" ? entry - slDelta : entry + slDelta;
  const tpPrice = dir==="buy" ? entry + tpDelta : entry - tpDelta;

  document.getElementById("st-result").innerHTML = `
    <p><b>Stop Loss Price:</b> ${fmt(slPrice,5)}</p>
    <p><b>Take Profit Price (R=${fmt(rr,2)}):</b> ${fmt(tpPrice,5)}</p>
    <p><b>SL Distance:</b> ${fmt(slPips,1)} pips • <b>TP Distance:</b> ${fmt(slPips*rr,1)} pips</p>
  `;
});

// ---------- Risk–Reward from Prices ----------
document.getElementById("form-rr").addEventListener("submit",(e)=>{
  e.preventDefault();
  const pipSize = toNum(document.getElementById("rr-pipsize").value);
  const dir     = document.getElementById("rr-direction").value;
  const entry   = toNum(document.getElementById("rr-entry").value);
  const slPrice = toNum(document.getElementById("rr-slprice").value);
  const tpPrice = toNum(document.getElementById("rr-tpprice").value);
  if([pipSize,entry,slPrice,tpPrice].some(x=>!isFinite(x))) return alert("Please fill all fields.");

  const slPips = Math.abs(entry - slPrice) / pipSize;
  const tpPips = Math.abs(tpPrice - entry) / pipSize;
  const rr = slPips===0 ? 0 : (tpPips / slPips);

  // sanity relative to direction (optional info)
  const goodSL = (dir==="buy"  && slPrice < entry) || (dir==="sell" && slPrice > entry);
  const goodTP = (dir==="buy"  && tpPrice > entry) || (dir==="sell" && tpPrice < entry);

  document.getElementById("rr-result").innerHTML = `
    <p><b>SL Distance:</b> ${fmt(slPips,1)} pips • <b>TP Distance:</b> ${fmt(tpPips,1)} pips</p>
    <p><b>Risk–Reward:</b> 1:${fmt(rr,2)}</p>
    <p class="muted">${goodSL && goodTP ? "✔ Direction and levels look consistent." :
      "⚠ Check: SL/TP may be inconsistent with direction."}</p>
  `;
});
// </script>