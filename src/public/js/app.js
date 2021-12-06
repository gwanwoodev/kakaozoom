/* Define Variables */
const socket = io();
let peerConnection;
let stream;
let myDevices;
let dataChannel;

/* DOMS */
const listElement = document.querySelector("select#availableCameras");
const remoteVideo = document.querySelector("#remoteVideo");
const messageHistory = document.querySelector("#messageHistory");
const messageBox = document.querySelector("#messageBox");
const sendButton = document.querySelector("#sendButton");
/* Functions */

const updateCameraList = (cameras) => {
  listElement.innerHTML = "";
  cameras.map((camera) => {
    const cameraOption = document.createElement("option");
    cameraOption.label = camera.label;
    cameraOption.value = camera.deviceId;
    listElement.appendChild(cameraOption);
  });
};

const openMediaDevices = async (constraints) => {
  return await navigator.mediaDevices.getUserMedia(constraints);
};

const getConnectedDevices = async (type) => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === type);
};

/* Sockets */

socket.on("start", async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", offer, roomId);
});

socket.on("offer", async (offer) => {
  console.log(`Got Offer: `, offer);

  peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomId);
});

socket.on("answer", async (answer) => {
  console.log(`Got Answer: `, answer);
  await peerConnection.setRemoteDescription(answer);
});

socket.on("candidate", async (candidate) => {
  if (candidate) {
    try {
      console.log(`Got IceCandidate: `, candidate);
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error(`Error adding received ice candidate`, error);
    }
  }
});

/* create peer connection */

const makePeerConnection = async () => {
  const configuration = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  };
  peerConnection = new RTCPeerConnection(configuration);
  dataChannel = peerConnection.createDataChannel("chat");
  peerConnection.addEventListener("icecandidate", candidateListener);
  peerConnection.addEventListener("connectionstatechange", stateListener);
  peerConnection.addEventListener("track", trackListener);
  peerConnection.addEventListener("datachannel", channelListener);
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });

  dataChannel.addEventListener("open", channelOpen);
  dataChannel.addEventListener("close", channelClose);
  dataChannel.addEventListener("message", messageHandler);
};

/* Event Listeners */

const candidateListener = (evt) => {
  console.log(`candidate fired`);
  socket.emit("icecandidate", evt.candidate, roomId);
};

const stateListener = (evt) => {
  const {
    target: { iceConnectionState, remoteDescription },
  } = evt;

  if (iceConnectionState === "connected") console.log(`icecandidate fired`);
};

const trackListener = async (evt) => {
  const [remoteStream] = evt.streams;
  remoteVideo.srcObject = remoteStream;
};

const channelListener = (evt) => {
  dataChannel = evt.channel;
  console.log(`DataChannel: `, dataChannel);
};

const channelOpen = (evt) => {
  messageBox.disabled = false;
  messageBox.focus();
  sendButton.disabled = false;
  console.log(`DataChannel Open`);
};

const messageHandler = (evt) => {
  const message = evt.data;
  messageHistory.textContent += message + "\n";
};

const channelClose = (evt) => {
  messageBox.disabled = false;
  sendButton.disabled = false;
};

sendButton.addEventListener("click", (evt) => {
  const message = messageBox.value;
  dataChannel.send(message);
});

navigator.mediaDevices.addEventListener("devicechange", (evt) => {
  const newCameraList = getConnectedDevices("video");
  updateCameraList(newCameraList);
});

const initialize = async () => {
  try {
    const CONSTRAINTS = { video: true, audio: true };
    stream = await openMediaDevices(CONSTRAINTS);

    const connectedVideo = await getConnectedDevices("videoinput");
    updateCameraList(connectedVideo);

    console.log(`Got MediaStream: `, stream);
    console.log(`Cameras Found: `, connectedVideo);

    const videoElement = document.querySelector("video#localVideo");
    videoElement.srcObject = stream;

    socket.emit("join", roomId);
    makePeerConnection();
  } catch (error) {
    console.error("Error accessing media devices. ", error);
  }
};

initialize();
