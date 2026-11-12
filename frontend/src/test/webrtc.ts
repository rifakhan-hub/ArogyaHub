import { act } from "@testing-library/react";
import { vi } from "vitest";

class FakeTrack {
  enabled = true;
  constructor(public kind: "audio" | "video") {}
  stop() {}
}

class FakeMediaStream {
  tracks = [new FakeTrack("audio"), new FakeTrack("video")];
  getTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video");
  }
}

export class FakeSocket {
  static OPEN = 1;
  static sockets: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen?: () => void;
  onmessage?: (e: { data: string }) => void;
  onclose?: (e: { code: number; reason: string }) => void;

  constructor(public url: string) {
    FakeSocket.sockets.push(this);
    setTimeout(() => {
      this.readyState = FakeSocket.OPEN;
      this.onopen?.();
    });
  }

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = 3;
  }

  receive(message: object) {
    act(() => this.onmessage?.({ data: JSON.stringify(message) }));
  }
}

export class FakePeer {
  static peers: FakePeer[] = [];
  connectionState = "new";
  localDescription?: { toJSON: () => object };
  remoteDescription?: object;
  candidates: object[] = [];
  onicecandidate?: (e: { candidate: null }) => void;
  ontrack?: (e: { streams: FakeMediaStream[] }) => void;
  onconnectionstatechange?: () => void;

  constructor(public config: object) {
    FakePeer.peers.push(this);
  }

  addTrack() {}
  close() {
    this.connectionState = "closed";
  }
  async createOffer() {
    return { type: "offer", sdp: "fake-offer" };
  }
  async createAnswer() {
    return { type: "answer", sdp: "fake-answer" };
  }
  async setLocalDescription(description: object) {
    this.localDescription = { toJSON: () => description };
  }
  async setRemoteDescription(description: object) {
    this.remoteDescription = description;
  }
  async addIceCandidate(candidate: object) {
    this.candidates.push(candidate);
  }

  connect() {
    act(() => {
      this.ontrack?.({ streams: [new FakeMediaStream()] });
      this.connectionState = "connected";
      this.onconnectionstatechange?.();
    });
  }
}

export function installFakeWebRTC() {
  FakeSocket.sockets = [];
  FakePeer.peers = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.stubGlobal("RTCPeerConnection", FakePeer);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => new FakeMediaStream()) },
  });
}

export function removeFakeWebRTC() {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "mediaDevices");
}
