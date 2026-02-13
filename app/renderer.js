let ws;
let myName;

console.log("renderer.js загружен");

function connect() {
  myName = document.getElementById("name").value;
  if (!myName) return alert("Введи ник");

  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "login",
      name: myName
    }));
  };

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.type === "users") {
      renderUsers(data.users);
    }

    if (data.type === "incoming_call") {
      alert("Звонит " + data.from);
    }
  };

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
}

function renderUsers(users) {
  const ul = document.getElementById("users");
  ul.innerHTML = "";

  users.forEach(u => {
    if (u !== myName) {
      const li = document.createElement("li");
      li.textContent = u;
      li.onclick = () => call(u);
      ul.appendChild(li);
    }
  });
}

function call(user) {
  ws.send(JSON.stringify({
    type: "call",
    from: myName,
    to: user
  }));
}
