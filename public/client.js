const ws = new WebSocket(`ws://${location.host}`);

let pc;
let localStream;

function join() {
  const name = document.getElementById("name").value.trim();
  if (!name) return;

  ws.send(JSON.stringify({ join: name }));
  start();
}

ws.onmessage = async (event) => {
  const msg = JSON.parse(event.data);

  if (msg.users) {
    const ul = document.getElementById("users");
    ul.innerHTML = "";
    msg.users.forEach(u => {
      const li = document.createElement("li");
      li.textContent = u;
      ul.appendChild(li);
    });
  }

  if (msg.offer) {
    await createPeer();
    await pc.setRemoteDescription(msg.offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
  }

  if (msg.answer) {
    await pc.setRemoteDescription(msg.answer);
  }

  if (msg.ice) {
    await pc.addIceCandidate(msg.ice);
  }
};

async function start() {
  await createPeer();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer }));
}

async function createPeer() {
  if (pc) return;

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.onicecandidate = e => {
    if (e.candidate) ws.send(JSON.stringify({ ice: e.candidate }));
  };

  pc.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    audio.controls = true;
    document.body.appendChild(audio);
  };
}
