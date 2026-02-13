let ws, myName;
let pc, localStream;

const audio = document.getElementById("remoteAudio");

async function login() {
  myName = name.value;
  ws = new WebSocket(location.origin.replace("http","ws"));

  ws.onopen = () => ws.send(JSON.stringify({ type:"login", name:myName }));

  ws.onmessage = async e => {
    const d = JSON.parse(e.data);

    if (d.type === "users") {
      users.innerHTML = "";
      d.users.forEach(u => {
        if (u !== myName) {
          const li = document.createElement("li");
          li.textContent = "📞 " + u;
          li.onclick = () => call(u);
          users.appendChild(li);
        }
      });
    }

    if (d.type === "call") {
      if (confirm("Звонит " + d.from)) {
        await startRTC(d.from, true);
        ws.send(JSON.stringify({ type:"answer", to:d.from, from:myName }));
      }
    }

    if (d.type === "offer") {
      await pc.setRemoteDescription(d.offer);
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      ws.send(JSON.stringify({ type:"answer_sdp", to:d.from, answer:ans }));
    }

    if (d.type === "answer_sdp") {
      await pc.setRemoteDescription(d.answer);
    }

    if (d.type === "ice") {
      await pc.addIceCandidate(d.candidate);
    }
  };

  login.style.display="none";
  app.style.display="block";
}

async function startRTC(target, isAnswer=false) {
  localStream = await navigator.mediaDevices.getUserMedia({ audio:true });

  pc = new RTCPeerConnection();
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.ontrack = e => audio.srcObject = e.streams[0];

  pc.onicecandidate = e => {
    if (e.candidate) {
      ws.send(JSON.stringify({
        type:"ice",
        to:target,
        from:myName,
        candidate:e.candidate
      }));
    }
  };

  if (!isAnswer) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({
      type:"offer",
      to:target,
      from:myName,
      offer
    }));
  }
}

function call(user) {
  ws.send(JSON.stringify({
    type:"call",
    from:myName,
    to:user
  }));
  startRTC(user);
}
