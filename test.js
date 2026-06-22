
(function(){
  const TK=localStorage.getItem("access_token");
  if(!TK){location.href="/login";return;}
  try{const p=JSON.parse(atob(TK.split(".")[1]));if(p.exp&&Date.now()>=p.exp*1000){localStorage.removeItem("access_token");location.href="/login";return;}}catch(e){location.href="/login";return;}
  PHSidebar.init("profile","../../../");
  const H={Authorization:"Bearer "+TK,"Content-Type":"application/json"};
  const API_BASE=(location.hostname==="localhost"||location.hostname==="127.0.0.1")
    ? (location.port === "3000" ? "http://localhost:5000" : "")
    : "https://projecthive-backend.onrender.com";
  const COLS=["#6366F1","#7C3AED","#EC4899","#10B981","#F59E0B","#3B82F6","#EF4444","#14B8A6","#6D28D9","#0EA5E9"];
  const SUGG=["React","Node.js","Python","TypeScript","JavaScript","Flutter","MongoDB","Firebase","Machine Learning","UI/UX","Figma","Java","C++","Django","SQL","Docker","Git","Next.js","Tailwind","PostgreSQL"];
  let skills=[],avColor="#6366F1",avatarB64="",bannerB64="";

  // Tabs
  window.showSec=function(id,btn){
    document.querySelectorAll(".sec").forEach(s=>s.classList.remove("on"));
    document.querySelectorAll(".stab").forEach(b=>b.classList.remove("on"));
    document.getElementById("sec-"+id).classList.add("on");
    btn.classList.add("on");
  };

  // Colors
  const cdr=document.getElementById("cdr");
  cdr.innerHTML=COLS.map(c=>`<div class="cdot" style="background:${c}" onclick="setColor('${c}')" title="${c}"></div>`).join("");
  window.setColor=function(c){
    avColor=c;
    if(!avatarB64){document.getElementById("avc").style.background=c;}
    document.querySelectorAll(".cdot").forEach(d=>d.classList.toggle("sel",d.style.background===c||d.style.background.replace(/\s/g,"")===c));
  };

  /* Helper to resize and compress image client-side using Canvas */
  function resizeImage(file, maxW, maxH, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        if (width > maxW || height > maxH) {
          if (width > height) {
            height = Math.round(height * maxW / width);
            width = maxW;
          } else {
            width = Math.round(width * maxH / height);
            height = maxH;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type || "image/jpeg", 0.85);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Banner
  window.handleBanner=function(inp){
    const file=inp.files[0];if(!file)return;
    openCropModal(file, 'banner');
  };

  // Avatar
  window.handleAvatar=function(inp){
    const file=inp.files[0];if(!file)return;
    openCropModal(file, 'avatar');
  };

  // Remove Banner
  window.removeBanner=function(){
    bannerB64="";
    const img=document.getElementById("bimg");
    img.style.display="none";
    img.src="";
    document.getElementById("bzone").style.background="";
    document.getElementById("rm-banner").style.display="none";
    calcPct();
    PHToast?.success("Banner removed");
  };

  // Live update hero
  window.liveUpdate=function(){
    const fn=document.getElementById("p-fn").value;
    const ln=document.getElementById("p-ln").value;
    const uni=document.getElementById("p-uni").value;
    const major=document.getElementById("p-major").value;
    document.getElementById("hname").textContent=(fn+" "+ln).trim()||"Your Name";
    document.getElementById("hmeta").textContent=[uni,major].filter(Boolean).join(" · ")||"University · Major";
    document.getElementById("aini").textContent=((fn[0]||"")+(ln[0]||"")).toUpperCase()||"?";
    calcPct();
  };

  // Skills
  function renderSugg(){
    const used=skills.map(s=>(s.name||s).toLowerCase());
    document.getElementById("sksugg").innerHTML=SUGG.filter(s=>!used.includes(s.toLowerCase())).slice(0,12).map(s=>`<button type="button" class="sk-sug" onclick="addSkillVal('${s}')"><span style="font-family:'Material Symbols Outlined';font-size:12px">add</span>${s}</button>`).join("");
  }
  function renderSkills(){
    const w=document.getElementById("skw");
    w.innerHTML=skills.length?skills.map((s,i)=>`<div class="sk-tag">${s.name||s}<button type="button" onclick="remSkill(${i})">x</button></div>`).join(""):`<span style="font-size:12px;color:var(--sub)">No skills yet</span>`;
    renderSugg();
  }
  window.addSkill=function(){const inp=document.getElementById("sk-inp"),v=inp.value.trim();if(!v)return;addSkillVal(v);inp.value="";};
  window.addSkillVal=function(v){if(skills.some(s=>(s.name||s).toLowerCase()===v.toLowerCase())){PHToast?.error("Already added");return;}skills.push({name:v,level:"intermediate"});renderSkills();calcPct();};
  window.remSkill=function(i){skills.splice(i,1);renderSkills();calcPct();};

  // Completion
  window.calcPct=function(){
    const fields=[
      !!(document.getElementById("p-fn").value.trim()&&document.getElementById("p-ln").value.trim()),
      !!(avatarB64||avColor!=="#6366F1"),
      document.getElementById("p-bio").value.trim().length>10,
      !!document.getElementById("p-uni").value.trim(),
      !!document.getElementById("p-major").value.trim(),
      !!document.getElementById("p-year").value,
      skills.length>0,
      !!(document.getElementById("p-gh").value.trim()||document.getElementById("p-li").value.trim()),
    ];
    const pct=Math.round(fields.filter(Boolean).length/fields.length*100);
    document.getElementById("pct-text").textContent=pct;
    document.getElementById("pct-big").textContent=pct+"%";
    document.getElementById("pbar-fill").style.width=pct+"%";
    document.getElementById("ring-svg").style.strokeDashoffset=94.2-(94.2*pct/100);
    const circ=314.16;
    const avc=document.getElementById("av-ring-c");
    if(avc)avc.style.strokeDashoffset=circ-(circ*pct/100);
    const hmeta=document.getElementById("hmeta");
    const fn=document.getElementById("p-fn").value;const ln=document.getElementById("p-ln").value;
    const uni=document.getElementById("p-uni").value;const major=document.getElementById("p-major").value;
    if(hmeta)hmeta.textContent=[uni,major].filter(Boolean).join(" · ")||"University · Major";
  };

  // ── Show cached data instantly (before Render wakes up) ──
  try {
    const cp = JSON.parse(localStorage.getItem('ph-user-cache') || 'null');
    if (cp) {
      const fn = cp.firstName || cp.first_name || ''; const ln = cp.lastName || cp.last_name || '';
      if (fn || ln) {
        document.getElementById('hname').textContent = (fn + ' ' + ln).trim();
        document.getElementById('aini').textContent = ((fn[0]||'') + (ln[0]||'')).toUpperCase() || '?';
        const uni = cp.university || ''; const major = cp.major || '';
        document.getElementById('hmeta').textContent = [uni, major].filter(Boolean).join(' · ') || 'University · Major';
        document.getElementById('p-fn').value = fn;
        document.getElementById('p-ln').value = ln;
        if (uni) document.getElementById('p-uni').value = uni;
        calcPct();
      }
    }
  } catch(_) {}

  // Load full profile from API
  fetch(API_BASE+"/api/users/me",{headers:H}).then(r=>r.ok?r.json():null).then(u=>{
    if(!u)return;
    document.getElementById("p-fn").value=u.firstName||"";
    document.getElementById("p-ln").value=u.lastName||"";
    document.getElementById("p-uni").value=u.university||"";
    document.getElementById("p-major").value=u.major||"";
    document.getElementById("p-bio").value=u.bio||"";
    document.getElementById("p-gh").value=u.github||"";
    document.getElementById("p-li").value=u.linkedin||"";
    document.getElementById("p-po").value=u.portfolio||"";
    if(u.yearOfStudy)document.getElementById("p-year").value=u.yearOfStudy;
    if(u.status)document.getElementById("p-status").value=u.status;
    if(u.isPublic!==undefined){const t=document.getElementById("tog-public");if(t){if(u.isPublic)t.classList.add("on");else t.classList.remove("on");}}
    skills=u.skills||[];renderSkills();
    if(u.avatar&&u.avatar.startsWith("data:")){avatarB64=u.avatar;const img=document.getElementById("aimg");img.src=u.avatar;img.style.display="block";document.getElementById("aini").style.display="none";document.getElementById("rm-photo").style.display="block";document.getElementById("color-row-wrap").style.display="none";}
    if(u.bannerImage&&u.bannerImage.startsWith("data:")){bannerB64=u.bannerImage;const bi=document.getElementById("bimg");bi.src=u.bannerImage;bi.style.display="block";document.getElementById("bzone").style.background="#000";document.getElementById("rm-banner").style.display="block";}
    const c=u.avatarColor||"#6366F1";setColor(c);
    if(!avatarB64){document.getElementById("avc").style.background=c;}
    const fn=u.firstName||"",ln=u.lastName||"";
    document.getElementById("aini").textContent=((fn[0]||"")+(ln[0]||"")).toUpperCase()||"?";
    document.getElementById("hname").textContent=(fn+" "+ln).trim()||"Your Name";
    document.getElementById("hmeta").textContent=[u.university,u.major].filter(Boolean).join(" · ")||"University · Major";
    calcPct();
  }).catch(()=>{renderSkills();});

  // Remove photo
  window.removePhoto=function(){avatarB64="";const img=document.getElementById("aimg");img.style.display="none";img.src="";document.getElementById("aini").style.display="";document.getElementById("avc").style.background=avColor;document.getElementById("color-row-wrap").style.display="flex";document.getElementById("rm-photo").style.display="none";calcPct();PHToast?.success("Photo removed");};

  // Save
  document.getElementById("pform").onsubmit=async function(e){
    e.preventDefault();const btn=document.getElementById("sbtn");
    btn.innerHTML=`<span style="font-family:'Material Symbols Outlined';animation:spin .7s linear infinite;display:inline-block">progress_activity</span> Saving…`;btn.disabled=true;
    try{
      const payload={firstName:document.getElementById("p-fn").value.trim(),lastName:document.getElementById("p-ln").value.trim(),university:document.getElementById("p-uni").value.trim(),major:document.getElementById("p-major").value.trim(),bio:document.getElementById("p-bio").value.trim(),github:document.getElementById("p-gh").value.trim(),linkedin:document.getElementById("p-li").value.trim(),portfolio:document.getElementById("p-po").value.trim(),yearOfStudy:parseInt(document.getElementById("p-year").value)||null,status:document.getElementById("p-status").value,skills,avatarColor:avColor};
      payload.isPublic=document.getElementById("tog-public")?document.getElementById("tog-public").classList.contains("on"):true;
      payload.avatar=avatarB64||"";
      payload.bannerImage=bannerB64||"";
      const r=await fetch(API_BASE+"/api/users/me",{method:"PATCH",headers:H,body:JSON.stringify(payload)});
      if(r.ok) {
        PHToast?.success('Profile saved! <span class="ph-svg-icon" style="display:inline-flex;align-items:center;vertical-align:middle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>');
        // update cache
        const d = await r.json();
        if(d.user) localStorage.setItem('ph-user-cache', JSON.stringify(d.user));
      } else {
        const d=await r.json();
        PHToast?.error(d.message||"Save failed");
      }
    }catch(e){PHToast?.error("Server offline");}
    btn.innerHTML=`<span style="font-family:'Material Symbols Outlined';font-size:20px">save</span> Save Profile`;btn.disabled=false;
  };

  /* Crop / Resize Modal Logic */
  let activeCropFile = null;
  let activeCropType = 'avatar';
  let cropImg = null;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const cropModal = document.getElementById('crop-modal');
  const cropCanvas = document.getElementById('crop-canvas');
  const cropCtx = cropCanvas.getContext('2d');
  const cropSlider = document.getElementById('crop-slider');

  window.openCropModal = function(file, type) {
    activeCropFile = file;
    activeCropType = type;
    document.getElementById('crop-title').textContent = type === 'avatar' ? 'Edit Profile Photo' : 'Edit Banner Photo';
    
    const reader = new FileReader();
    reader.onload = function(e) {
      cropImg = new Image();
      cropImg.onload = function() {
        scale = 1;
        panX = 0;
        panY = 0;
        cropSlider.value = 1;
        cropModal.classList.add('show');
        resizeCanvas();
        drawCropCanvas();
      };
      cropImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.closeCropModal = function() {
    cropModal.classList.remove('show');
    activeCropFile = null;
    cropImg = null;
  };

  function resizeCanvas() {
    const container = document.getElementById('crop-canvas-container');
    const w = container.clientWidth;
    const h = container.clientHeight;
    cropCanvas.width = w * window.devicePixelRatio;
    cropCanvas.height = h * window.devicePixelRatio;
    cropCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function drawCropCanvas() {
    if (!cropImg) return;
    const cw = cropCanvas.width / window.devicePixelRatio;
    const ch = cropCanvas.height / window.devicePixelRatio;
    
    cropCtx.clearRect(0, 0, cw, ch);
    cropCtx.save();
    
    const imgRatio = cropImg.width / cropImg.height;
    const canvasRatio = cw / ch;
    
    let drawW, drawH;
    if (imgRatio > canvasRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
    }
    
    const s = scale;
    const w = drawW * s;
    const h = drawH * s;
    const cx = cw / 2;
    const cy = ch / 2;
    
    cropCtx.translate(cx + panX, cy + panY);
    cropCtx.drawImage(cropImg, -w/2, -h/2, w, h);
    cropCtx.restore();
    
    // Mask overlay
    cropCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    cropCtx.beginPath();
    cropCtx.rect(0, 0, cw, ch);
    
    if (activeCropType === 'avatar') {
      const radius = Math.min(cw, ch) * 0.38;
      cropCtx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    } else {
      const rectW = cw * 0.9;
      const rectH = rectW * 0.35;
      cropCtx.rect(cx - rectW/2, cy - rectH/2, rectW, rectH, true);
    }
    
    cropCtx.fill();
    
    // Outline boundary
    cropCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    cropCtx.lineWidth = 2;
    cropCtx.beginPath();
    if (activeCropType === 'avatar') {
      const radius = Math.min(cw, ch) * 0.38;
      cropCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    } else {
      const rectW = cw * 0.9;
      const rectH = rectW * 0.35;
      cropCtx.rect(cx - rectW/2, cy - rectH/2, rectW, rectH);
    }
    cropCtx.stroke();
  }

  cropSlider.addEventListener('input', function() {
    scale = parseFloat(this.value);
    drawCropCanvas();
  });

  const cContainer = document.getElementById('crop-canvas-container');
  cContainer.addEventListener('mousedown', dragStart);
  cContainer.addEventListener('touchstart', dragStart, { passive: true });

  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: false });

  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (!cropImg) return;
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX - panX;
    startY = clientY - panY;
  }

  function dragMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    panX = clientX - startX;
    panY = clientY - startY;
    drawCropCanvas();
  }

  function dragEnd() {
    isDragging = false;
  }

  document.getElementById('crop-save-btn').addEventListener('click', function() {
    if (!cropImg) return;
    
    const outCanvas = document.createElement('canvas');
    let outW, outH;
    
    if (activeCropType === 'avatar') {
      outW = 400;
      outH = 400;
    } else {
      outW = 1200;
      outH = 420;
    }
    
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext('2d');
    
    const cw = cropCanvas.width / window.devicePixelRatio;
    const ch = cropCanvas.height / window.devicePixelRatio;
    
    let maskW, maskH;
    if (activeCropType === 'avatar') {
      maskW = Math.min(cw, ch) * 0.76;
      maskH = maskW;
    } else {
      maskW = cw * 0.9;
      maskH = maskW * 0.35;
    }
    
    outCtx.save();
    
    const imgRatio = cropImg.width / cropImg.height;
    const canvasRatio = cw / ch;
    
    let drawW, drawH;
    if (imgRatio > canvasRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
    }
    
    const w = drawW * scale;
    const h = drawH * scale;
    
    outCtx.translate(outW / 2, outH / 2);
    const scaleFactor = outW / maskW;
    outCtx.scale(scaleFactor, scaleFactor);
    outCtx.translate(panX, panY);
    outCtx.drawImage(cropImg, -w/2, -h/2, w, h);
    outCtx.restore();
    
    const resizedBase64 = outCanvas.toDataURL('image/jpeg', 0.88);
    
    if (activeCropType === 'avatar') {
      avatarB64 = resizedBase64;
      const img = document.getElementById("aimg");
      img.src = avatarB64;
      img.style.display = "block";
      document.getElementById("aini").style.display = "none";
      document.getElementById("avc").style.background = "transparent";
      document.getElementById("color-row-wrap").style.display = "none";
      document.getElementById("rm-photo").style.display = "block";
      calcPct();
      PHToast?.success("Profile photo adjusted!");
    } else {
      bannerB64 = resizedBase64;
      const img = document.getElementById("bimg");
      img.src = bannerB64;
      img.style.display = "block";
      document.getElementById("bzone").style.background = "#000";
      document.getElementById("rm-banner").style.display = "block";
      calcPct();
      PHToast?.success("Banner adjusted!");
    }
    
    closeCropModal();
  });

})();
