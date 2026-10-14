/**
 * מפה לרשימות: כפתור #map-btn פותח את #dmap. Leaflet ואריחי OpenStreetMap נטענים רק בלחיצה הראשונה.
 * כל כרטיס עם data-ll="lat,lng" הופך לסמן; כרטיס מוסתר (סינון/חיפוש) — לא מוצג. רענון: window.__mapRefresh().
 */
export const MAP_CSS = `
.map-btn{height:48px;padding:0 18px;border-radius:14px;border:0;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-size:16px;font-weight:800;display:inline-flex;align-items:center;gap:8px;cursor:pointer}
.dir-tools .map-btn{margin-inline-start:auto}
@media (max-width:620px){.dir-tools .map-btn{order:2;height:44px}.dir-tools .dir-q{order:3;flex-basis:100%}}
.map-btn[aria-pressed=true]{background:var(--sky);color:var(--navy)}
.dmap{position:relative;height:440px;border-radius:20px;overflow:hidden;margin-bottom:18px;box-shadow:0 2px 12px rgba(0,0,0,.08);z-index:0}.dmap[hidden]{display:none}
@media (max-width:620px){.dmap{height:60vh}}
.leaflet-popup-content{font-family:inherit;direction:rtl;text-align:right;font-size:15px}.leaflet-popup-content a,.leaflet-popup-content b{font-weight:800}.mp-f{color:#566173;font-size:13px}
`;

export const MAP_ICON = 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14';

export function mapScript(cardSel, subSel) {
  return `(function(){
var mb=document.getElementById('map-btn'),mbox=document.getElementById('dmap'),map=null,layer=null;if(!mb||!mbox)return;
var cards=[].slice.call(document.querySelectorAll('${cardSel}'));
function marks(){if(!map)return;layer.clearLayers();var pts=[];
  cards.forEach(function(c){var ll=c.getAttribute('data-ll');if(!ll||c.hidden)return;var p=ll.split(',').map(Number);pts.push(p);
    var a=c.tagName==='A'?c:c.querySelector('.stretch, h3 a'),box=document.createElement('div'),b=document.createElement(a?'a':'b');
    b.textContent=(c.querySelector('h3')||{}).textContent||'';if(a){b.href=a.getAttribute('href');}box.appendChild(b);
    var f=c.querySelector('${subSel}');if(f){var s=document.createElement('div');s.textContent=f.textContent;s.className='mp-f';box.appendChild(s);}
    L.circleMarker(p,{radius:9,color:'#fff',weight:2,fillColor:'#244782',fillOpacity:1}).bindPopup(box).addTo(layer);});
  if(pts.length)map.fitBounds(pts,{padding:[30,30],maxZoom:16});}
window.__mapRefresh=marks;
function openMap(){mbox.hidden=false;mb.setAttribute('aria-pressed','true');
  if(map){map.invalidateSize();marks();return;}
  var css=document.createElement('link');css.rel='stylesheet';css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(css);
  var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  sc.onload=function(){map=L.map(mbox,{scrollWheelZoom:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    layer=L.layerGroup().addTo(map);marks();};document.head.appendChild(sc);}
mb.addEventListener('click',function(){if(mbox.hidden)openMap();else{mbox.hidden=true;mb.setAttribute('aria-pressed','false');}});
})();`;
}
