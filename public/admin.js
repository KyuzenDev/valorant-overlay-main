const socket = io();

let winby = { bo5: "3", bo3: "2", bo1: "1" };
let localstate = {};

// Update admin panel UI when state changes
function updateAdminUI(state) {
    let tm = "";
    if (state.timeout.isActive == 1) {
        tm =
            " - TIMEOUT ACTIVE: " +
            state["name" + state.timeout.team].toUpperCase();
    }
    document.getElementById("matchtitle").innerText =
        state.event_name + " - " + state.event_stage;
    document.getElementById("map").innerText =
        "Map " +
        state.map +
        ": " +
        state.mapname +
        " - Half " +
        state.half +
        tm;

    document.getElementById("tnameL").innerText = state.nameL.toUpperCase();
    document.getElementById("abbrL").innerText = state.abbrL;
    document.getElementById("logoL").style = `content: url("${state.logoL}")`;
    document.getElementById("scoreL").innerText =
        "■".repeat(state.scoreL) +
        "□".repeat(winby[state.format] - state.scoreL);
    document.getElementById("remL").innerText = state.timeout.L_remain;
    document.getElementById("timeout-start-L").disabled = state.timeout.L_remain <= 0;

    document.getElementById("tnameR").innerText = state.nameR.toUpperCase();
    document.getElementById("abbrR").innerText = state.abbrR;
    document.getElementById("logoR").style = `content: url("${state.logoR}")`;
    document.getElementById("scoreR").innerText =
        "■".repeat(state.scoreR) +
        "□".repeat(winby[state.format] - state.scoreR);
    document.getElementById("remR").innerText = state.timeout.R_remain;
    document.getElementById("timeout-start-R").disabled = state.timeout.R_remain <= 0;

    if (state.half == "1") {
        document.getElementById("tl").classList = "ct";
        document.getElementById("tr").classList = "t";
    } else if (state.half == "2") {
        document.getElementById("tl").classList = "t";
        document.getElementById("tr").classList = "ct";
    }
}

function setConnectionStatus(isConnected) {
    const status = document.getElementById("sync-status");
    const label = document.getElementById("sync-label");
    if (!status || !label) return;
    status.classList.toggle("offline", !isConnected);
    label.innerText = isConnected ? "LIVE SYNC" : "OFFLINE";
}

// Initialize the admin panel with the current state
socket.on("initialize-overlay", (state) => {
    updateAdminUI(state);
    localstate = state;
    setConnectionStatus(true);
});

socket.on("connect", () => setConnectionStatus(true));
socket.on("disconnect", () => setConnectionStatus(false));

// Listen for updates from the server
socket.on("admin-update", (state) => {
    updateAdminUI(state);
    localstate = state;
});

// Request a state update to store locally
function requestState() {
    socket.emit("request-state");
    console.log("Sent an update request.");
}

// Process answer for state update request + also update the ui :p
socket.on("answer", (state) => {
    localstate = state;
    updateAdminUI(state);
});

// Send commands from admin panel
function sendCommand(action, value) {
    socket.emit("admin-command", { action: action, value: value });
}
function header(type, team) {
    socket.emit("admin-command", {
        action: "header-start",
        type: type,
        team: team,
    });
}

function update(target, source) {
    try {
        var value = document.getElementById(source).value;
    } catch (e) {
        value = source;
    }
    socket.emit("admin-command", {
        action: "update",
        target: target,
        value: value,
    });
}

// Switch sides
function switchsides() {
    if (localstate.half == "1") {
        update("half", "2");
    } else if (localstate.half == "2") {
        update("half", "1");
    }
}

document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) return;
    const key = event.key.toLowerCase();

    if (event.key === "1") sendCommand(event.shiftKey ? "score-rem" : "score-add", "L");
    if (event.key === "2") sendCommand(event.shiftKey ? "score-rem" : "score-add", "R");
    if (key === "q") sendCommand("score-add", "L");
    if (key === "a") sendCommand("score-rem", "L");
    if (key === "p") sendCommand("score-add", "R");
    if (key === "l") sendCommand("score-rem", "R");
    if (key === "s") switchsides();
    if (key === "z") header("mp", "L");
    if (key === "x") header("mp", "R");
    if (key === "t") {
        if (localstate.header && localstate.header.isActive == 1 && localstate.header.type === "tp") {
            sendCommand("header-end");
        } else {
            header("tp", "0");
        }
    }
    if (key === "r") sendCommand("timeout-reset");
    if (event.key === "Escape") sendCommand("header-end");
});
