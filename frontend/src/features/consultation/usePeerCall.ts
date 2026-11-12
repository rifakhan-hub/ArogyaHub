import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/api/client";
import { env } from "@/lib/env";

export type PeerState = "starting" | "waiting" | "connecting" | "connected" | "ended" | "failed";

interface Signal {
  type: string;
  peer?: boolean;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export function signalUrl(appointmentId: string) {
  const url = new URL(
    `${env.API_URL}/appointments/${appointmentId}/consultation/signal`,
    window.location.href,
  );
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function usePeerCall(appointmentId: string, iceServers: RTCIceServer[] | null) {
  const [state, setState] = useState<PeerState>("starting");
  const [error, setError] = useState("");
  const [local, setLocal] = useState<MediaStream>();
  const [remote, setRemote] = useState<MediaStream>();
  const [attempt, setAttempt] = useState(0);
  const hangupRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!iceServers) return;
    const servers = iceServers;
    let stopped = false;
    let socket: WebSocket | undefined;
    let peer: RTCPeerConnection | undefined;
    let stream: MediaStream | undefined;
    let queue = Promise.resolve();

    function fail(message: string) {
      if (stopped) return;
      setError(message);
      setState("failed");
    }

    function send(message: Signal) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    }

    function newPeer() {
      peer?.close();
      const pc = new RTCPeerConnection({ iceServers: servers });
      const media = stream;
      media?.getTracks().forEach((track) => pc.addTrack(track, media));
      pc.onicecandidate = (e) =>
        e.candidate && send({ type: "ice", candidate: e.candidate.toJSON() });
      pc.ontrack = (e) => setRemote(e.streams[0]);
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setState("connected");
        if (pc.connectionState === "failed") fail("The video connection dropped. Try rejoining.");
      };
      peer = pc;
      return pc;
    }

    async function handle(message: Signal) {
      if (message.type === "ready") {
        setState(message.peer ? "connecting" : "waiting");
      } else if (message.type === "peer-joined") {
        setState("connecting");
        const pc = newPeer();
        await pc.setLocalDescription(await pc.createOffer());
        send({ type: "offer", sdp: pc.localDescription?.toJSON() });
      } else if (message.type === "offer" && message.sdp) {
        const pc = newPeer();
        await pc.setRemoteDescription(message.sdp);
        await pc.setLocalDescription(await pc.createAnswer());
        send({ type: "answer", sdp: pc.localDescription?.toJSON() });
      } else if (message.type === "answer" && message.sdp) {
        await peer?.setRemoteDescription(message.sdp);
      } else if (message.type === "ice" && message.candidate) {
        await peer?.addIceCandidate(message.candidate).catch(() => {});
      } else if (message.type === "peer-left") {
        peer?.close();
        peer = undefined;
        setRemote(undefined);
        setState("waiting");
      } else if (message.type === "hangup") {
        stop();
        setState("ended");
      }
    }

    function stop() {
      stopped = true;
      socket?.close();
      peer?.close();
      stream?.getTracks().forEach((track) => track.stop());
    }

    hangupRef.current = () => {
      send({ type: "hangup" });
      stop();
      setState("ended");
    };

    async function begin() {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
        return fail("This browser can't make video calls. Try the latest Chrome, Edge or Firefox.");
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        return fail("Allow camera and microphone access in your browser, then rejoin.");
      }
      if (stopped) return stream.getTracks().forEach((track) => track.stop());
      setLocal(stream);

      socket = new WebSocket(signalUrl(appointmentId));
      socket.onopen = () => socket?.send(JSON.stringify({ type: "auth", token: getAccessToken() }));
      socket.onmessage = (e) => {
        const message = JSON.parse(e.data) as Signal;
        queue = queue
          .then(() => handle(message))
          .catch(() => fail("The call setup failed. Try rejoining."));
      };
      socket.onclose = (e) => {
        if (stopped) return;
        if (e.code === 4409) {
          stop();
          setState("ended");
        } else {
          fail(e.reason || "We lost the connection to the call. Try rejoining.");
        }
      };
    }

    begin();
    return stop;
  }, [appointmentId, iceServers, attempt]);

  function toggle(kind: "audio" | "video") {
    const tracks = kind === "audio" ? local?.getAudioTracks() : local?.getVideoTracks();
    tracks?.forEach((track) => (track.enabled = !track.enabled));
    return tracks?.[0]?.enabled ?? false;
  }

  return {
    state,
    error,
    local,
    remote,
    toggle,
    hangup: () => hangupRef.current(),
    retry: () => {
      setState("starting");
      setError("");
      setAttempt((a) => a + 1);
    },
  };
}
