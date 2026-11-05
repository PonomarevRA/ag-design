let disposed = false;
let pending = false;
const state = document.getElementById('state');
/** Render only bounded local metadata as text; polling this route never records another request. */
async function refresh() {
  if (disposed || pending || document.hidden) return;
  pending = true;
  try {
    const response = await fetch('/api/desktop/v1/widget', {redirect:'error', signal:AbortSignal.timeout(4000)});
    if (!response.ok) throw new Error('Snapshot unavailable');
    const snapshot = await response.json();
    if (disposed) return;
    if (snapshot.appId !== 'ag-design' || snapshot.schemaVersion !== 'ag-desktop/widget-v1') throw new Error('Unexpected application identity');
    const list = document.getElementById('requests');list.replaceChildren();
    for (const row of snapshot.requests.slice(-8).reverse()) {
      const item=document.createElement('li');
      for (const [tag,value] of [['strong',row.operation+' · '+row.status],['p',row.actorLabel+' · '+row.timestamp],['p',row.requestSummary],['p',row.responseSummary]]) {
        const text=document.createElement(tag);text.textContent=value;item.append(text);
      }
      list.append(item);
    }
    state.textContent = snapshot.requests.length ? 'Snapshot captured '+snapshot.capturedAt : 'No requests observed in this process';
    document.getElementById('coverage').textContent=snapshot.source;
  } catch { if (!disposed) state.textContent='Offline or invalid snapshot. Reopen the existing service or refresh.'; }
  finally { pending = false; }
}
document.getElementById('refresh').addEventListener('click',refresh);
if (new URLSearchParams(location.search).get('desktop')==='1') document.getElementById('open').href='/?desktop=1';
const timer=setInterval(refresh,2000);
window.addEventListener('pagehide',()=>{disposed=true;clearInterval(timer);},{once:true});
refresh();
