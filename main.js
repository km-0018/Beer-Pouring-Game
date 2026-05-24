const cv=document.getElementById('c');
const cx=cv.getContext('2d');

const W=370;
const H=260;

cv.width=W;
cv.height=H;

const GX=220;
const GY=20;
const GW=75;
const GH=200;
const GMAX=170;

let gAng=0;
let cAng=0;
let beer=0;
let foam=0;

let hG=false;
let hP=false;
let over=false;
let started=false;
let ready=false;

let pts=[];
let overflowPts=[];

let oFlash=0;
let hi=0;

let raf;
let last=0;

const LIMIT=15;
let remain=LIMIT;


function hold(k,v){

  if(!ready || over){
    return;
  }

  if(k==='g'){
    hG=v;
    document.getElementById('glass-btn').classList.toggle('active',v);
  }

  if(k==='p'){
    hP=v;
    document.getElementById('pour-btn').classList.toggle('active',v);

    if(v && !started){
      started=true;
    }
  }
}

function finish(){

  if(!started || over){
    return;
  }

  hP=false;
  over=true;

  document.getElementById('pour-btn').classList.remove('active');

  calc();
}

function calc(){

  const tot=beer+foam;

  if(tot<8){
    show('少なすぎます…',0);
    return;
  }

  const br=beer/tot;
  const fr=foam/tot;

  const diff=Math.abs(br-0.80);

  const close=Math.max(0,1-diff*5);
  const fill=Math.min(1,tot/(GMAX*0.85));

  const sc=Math.round(close*fill*1000);

  if(sc>hi){
    hi=sc;
    document.getElementById('hv').textContent=hi;
  }

  const lbl=
    sc>=900?'🏆 神泡！':
    sc>=700?'👏 かなりうまい！':
    sc>=450?'🙂 いい感じ':
    '😅 泡だらけ…';

  show(lbl,sc,br,fr);
}

function show(lbl,sc,br,fr){

  document.getElementById('ov-label').textContent=lbl;
  document.getElementById('ov-score').textContent=sc+'点';

  document.getElementById('ov-ratio').textContent=
    br!=null
      ? `ビール ${Math.round(br*100)}% : 泡 ${Math.round(fr*100)}%`
      : '';

  document.getElementById('ov').classList.add('show');
}

document.getElementById('retry').onclick=()=>{

  document.getElementById('ov').classList.remove('show');

  reset();

  startCountdown();
};

function reset(){

  gAng=0;
  cAng=0;
  beer=0;
  foam=0;

  hG=false;
  hP=false;

  over=false;
  started=false;
  ready=false;

  pts=[];
  overflowPts=[];

  oFlash=0;

  document.getElementById('sv').textContent='0';
  document.getElementById('rv').textContent='—';
  document.getElementById('tv').textContent=LIMIT.toFixed(1);
  remain=LIMIT;

  document.getElementById('glass-btn').classList.remove('active');
  document.getElementById('pour-btn').classList.remove('active');
}

async function startCountdown(){

  const el=document.getElementById('countdown');

  el.classList.add('show');

  for(const t of ['3','2','1','🍺']){
    el.textContent=t;
    await sleep(700);
  }

  el.classList.remove('show');

  ready=true;
}

function sleep(ms){
  return new Promise(r=>setTimeout(r,ms));
}

function upd(dt){

  if(over){
    return;
  }

  if(ready && started){

    remain=Math.max(0,remain-dt);

    document.getElementById('tv').textContent=
      remain.toFixed(1);

    if(remain<=0){
      finish();
      return;
    }
  }

  if(hG){
    gAng=Math.min(gAng+dt*55,45);
  }else{
    gAng=Math.max(gAng-dt*40,0);
  }

  if(hP){
    cAng=Math.min(cAng+dt*70,95);
  }else{
    cAng=Math.max(cAng-dt*50,0);
  }

  const peff=Math.max(0,Math.min(cAng/70,1));

  const ge=gAng/45;

  if(hP && peff>0.06 && started){

    const rate=peff*dt*28;

    const impact=Math.abs(gAng-(cAng*0.4))/45;

    const tot=beer+foam;

    if(tot<GMAX){

      const addBeer=Math.min(
        rate*(0.45+ge*0.65),
        GMAX-tot
      );

      beer+=addBeer;
    }

    const t2=beer+foam;

    if(t2<GMAX){

      const foamRate=
        (1-ge)*peff*dt*18
        + impact*dt*12;

      foam+=Math.min(
        foamRate,
        GMAX-t2
      );
    }

    for(let i=0;i<3;i++){
      pts.push({
        x:GX+GW/2+(Math.random()-0.5)*10,
        y:GY+25,
        vy:0.8+Math.random()*0.8,
        life:1,
        r:1.5+Math.random()*2
      });
    }
  }

  // 泡が落ち着く
  const settle=Math.min(foam,dt*1.4);

  foam-=settle;
  beer+=settle*0.35;

  pts=pts.filter(p=>{
    p.y+=p.vy;
    p.life-=dt*2.5;
    return p.life>0;
  });

  overflowPts=overflowPts.filter(p=>{
    p.x+=p.vx;
    p.y+=p.vy;
    p.life-=dt*1.4;
    return p.life>0;
  });

  const tot=beer+foam;

  if(tot>=GMAX){

    oFlash=Math.min(oFlash+dt*6,1);

    for(let i=0;i<4;i++){
      overflowPts.push({
        x:GX+GW/2,
        y:GY+GH-10,
        vx:(Math.random()-0.5)*2,
        vy:1+Math.random()*1.5,
        life:1
      });
    }

    beer=Math.max(0,beer-dt*12);
    foam=Math.max(0,foam-dt*14);

  }else{
    oFlash=Math.max(0,oFlash-dt*5);
  }

  if(tot>5){

    const br=beer/tot;
    const fr=foam/tot;

    document.getElementById('rv').textContent=
      `${Math.round(br*10)}:${Math.round(fr*10)}`;

    const score=Math.round(
      Math.max(0,1000-(Math.abs(br-0.8)*1200))
    );

    document.getElementById('sv').textContent=score;
  }
}

function draw(){

  cx.clearRect(0,0,W,H);

  drawBg();
  drawCan();
  drawStream();
  drawGlass();
  drawPts();
  drawOverflow();

  if(remain<=5 && started && !over){

    cx.fillStyle='rgba(255,0,0,0.06)';
    cx.fillRect(0,0,W,H);

    cx.fillStyle='rgba(255,255,255,0.9)';
    cx.font='bold 24px sans-serif';
    cx.textAlign='center';
    cx.fillText(
      '⏰ '+remain.toFixed(1),
      W/2,
      34
    );
  }

  if(oFlash>0){
    cx.fillStyle=`rgba(220,50,30,${oFlash*0.22})`;
    cx.fillRect(0,0,W,H);
  }
}

function drawBg(){

  cx.fillStyle='#f5f0e8';
  cx.fillRect(0,0,W,H);

  cx.fillStyle='rgba(100,60,20,0.08)';
  cx.beginPath();
  cx.ellipse(W/2,H-8,100,12,0,0,Math.PI*2);
  cx.fill();
}

function drawCan(){

  const cx2=110;
  const cy2=130;

  cx.save();

  cx.translate(cx2,cy2);

  const rad=((cAng-80)*Math.PI)/180;

  cx.rotate(rad);

  const cw=28;
  const ch=60;

  cx.fillStyle='#d4a820';

  cx.beginPath();
  cx.roundRect(-cw/2,-ch,cw,ch,3);
  cx.fill();

  cx.fillStyle='#f0c840';
  cx.fillRect(-cw/2+2,-ch+4,cw-4,7);

  cx.fillStyle='rgba(255,255,255,0.5)';
  cx.font='bold 7px sans-serif';
  cx.textAlign='center';
  cx.fillText('BEER',0,-ch+14);

  cx.fillStyle='#aaa';

  cx.beginPath();
  cx.ellipse(0,-ch,cw/2,5,0,0,Math.PI*2);
  cx.fill();

  cx.restore();
}

function drawStream(){

  if(!hP){
    return;
  }

  const peff=Math.max(0,Math.min(cAng/70,1));

  if(peff<0.06){
    return;
  }

  const sx=110+Math.cos(((cAng-80)*Math.PI/180)+Math.PI)*30;
  const sy=130+Math.sin(((cAng-80)*Math.PI/180)+Math.PI)*30;

  const ex=GX+GW/2;
  const ey=GY+GH-beer-foam;

  cx.save();

  cx.strokeStyle=`rgba(200,155,30,${peff*0.7})`;
  cx.lineWidth=3.5*peff;
  cx.lineCap='round';

  cx.beginPath();

  cx.moveTo(sx,sy);

  cx.bezierCurveTo(
    sx+20,
    sy+30,
    ex-15,
    ey-30,
    ex,
    ey
  );

  cx.stroke();

  cx.restore();
}

function drawGlass(){

  cx.save();

  const gCx=GX+GW/2;
  const gCy=GY+GH;

  cx.translate(gCx,gCy);

  cx.rotate(-gAng*Math.PI/180);

  cx.translate(-gCx,-gCy);

  const bTop=GY+GH-beer;
  const fTop=bTop-foam;

  cx.save();

  cx.beginPath();

  cx.moveTo(GX+6,GY+GH);
  cx.lineTo(GX+2,GY);
  cx.lineTo(GX+GW-2,GY);
  cx.lineTo(GX+GW-6,GY+GH);

  cx.closePath();

  cx.clip();

  // 理想ライン
  cx.strokeStyle='rgba(255,255,255,0.45)';
  cx.setLineDash([4,4]);

  const ideal=GY+GH-(GMAX*0.2);

  cx.beginPath();
  cx.moveTo(GX,ideal);
  cx.lineTo(GX+GW,ideal);
  cx.stroke();

  cx.setLineDash([]);

  if(beer>0){

    cx.fillStyle='#e8a020';
    cx.fillRect(GX,bTop,GW,beer);
  }

  if(foam>0){

    cx.fillStyle='#fff8e0';
    cx.fillRect(GX,fTop,GW,foam);

    for(let i=0;i<15;i++){

      const bx=GX+(i%4)*17+6;
      const by=fTop+(Math.floor(i/4))*8+3;

      cx.fillStyle=`rgba(255,255,255,${
        0.45+Math.sin(Date.now()/350+i)*0.2
      })`;

      cx.beginPath();

      cx.arc(
        bx,
        by,
        4+Math.sin(Date.now()/300+i*1.3)*1.5,
        0,
        Math.PI*2
      );

      cx.fill();
    }
  }

  cx.restore();

  cx.strokeStyle='rgba(160,200,255,0.5)';
  cx.lineWidth=1.5;

  cx.beginPath();

  cx.moveTo(GX+6,GY+GH);
  cx.lineTo(GX+2,GY);
  cx.lineTo(GX+GW-2,GY);
  cx.lineTo(GX+GW-6,GY+GH);

  cx.closePath();

  cx.stroke();

  cx.strokeStyle='rgba(200,225,255,0.25)';
  cx.lineWidth=6;

  cx.beginPath();

  cx.moveTo(GX+10,GY+8);
  cx.lineTo(GX+10,GY+GH-8);

  cx.stroke();

  cx.restore();
}

function drawPts(){

  pts.forEach(p=>{

    cx.fillStyle=`rgba(255,235,160,${p.life*0.45})`;

    cx.beginPath();

    cx.arc(p.x,p.y,p.r,0,Math.PI*2);

    cx.fill();
  });
}

function drawOverflow(){

  overflowPts.forEach(p=>{

    cx.fillStyle=`rgba(255,210,80,${p.life*0.7})`;

    cx.beginPath();

    cx.arc(p.x,p.y,3,0,Math.PI*2);

    cx.fill();
  });
}

function loop(ts){

  const dt=Math.min((ts-last)/1000,0.05);

  last=ts;

  upd(dt);
  draw();

  raf=requestAnimationFrame(loop);
}

document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('selectstart',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());

reset();

raf=requestAnimationFrame(ts=>{
  last=ts;
  loop(ts);
});

startCountdown();
