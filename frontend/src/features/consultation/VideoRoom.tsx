import { CameraOff, Mic, MicOff, PhoneOff, RotateCw, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { usePeerCall } from "./usePeerCall";

type PeerCall = ReturnType<typeof usePeerCall>;

export function PeerVideo({
  call,
  otherName,
  onLeave,
}: {
  call: PeerCall;
  otherName: string;
  onLeave?: () => void;
}) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const message = {
    starting: "Starting your camera…",
    waiting: `Waiting for ${otherName} to join the call…`,
    connecting: `Connecting to ${otherName}…`,
    connected: "",
    ended: "The call has ended.",
    failed: call.error,
  }[call.state];

  return (
    <div className="relative flex size-full min-h-[50vh] items-center justify-center overflow-hidden rounded-lg bg-stone-900 text-white">
      {call.remote && call.state === "connected" ? (
        <StreamVideo stream={call.remote} label={otherName} className="size-full object-cover" />
      ) : (
        <div className="flex max-w-md flex-col items-center gap-3 p-6 text-center">
          <p role="status" className="text-body">
            {message}
          </p>
          {call.state === "failed" && (
            <Button variant="outline" size="sm" onClick={call.retry}>
              <RotateCw aria-hidden /> Rejoin
            </Button>
          )}
        </div>
      )}

      {call.local && (
        <StreamVideo
          stream={call.local}
          muted
          label="Your camera"
          className="absolute right-3 bottom-20 aspect-video w-32 -scale-x-100 rounded-md border border-white/20 object-cover shadow-lg sm:w-44"
        />
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <ControlButton
          label={micOn ? "Mute microphone" : "Unmute microphone"}
          off={!micOn}
          onClick={() => setMicOn(call.toggle("audio"))}
        >
          {micOn ? <Mic aria-hidden /> : <MicOff aria-hidden />}
        </ControlButton>
        <ControlButton
          label={cameraOn ? "Turn camera off" : "Turn camera on"}
          off={!cameraOn}
          onClick={() => setCameraOn(call.toggle("video"))}
        >
          {cameraOn ? <Video aria-hidden /> : <VideoOff aria-hidden />}
        </ControlButton>
        {onLeave && (
          <ControlButton label="Leave call" off onClick={onLeave}>
            <PhoneOff aria-hidden />
          </ControlButton>
        )}
      </div>
    </div>
  );
}

function ControlButton({
  label,
  off,
  onClick,
  children,
}: {
  label: string;
  off: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-colors [&_svg]:size-5",
        off ? "bg-red-600 hover:bg-red-700" : "bg-white/15 hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}

function StreamVideo({
  stream,
  muted,
  label,
  className,
}: {
  stream: MediaStream;
  muted?: boolean;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <video ref={ref} autoPlay playsInline muted={muted} aria-label={label} className={className}>
      <track kind="captions" />
    </video>
  );
}

export function CallScreen({
  title,
  body,
  preview = false,
  children,
}: {
  title: string;
  body: string;
  preview?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex size-full min-h-[50vh] flex-col items-center justify-center gap-5 rounded-lg bg-stone-900 p-6 text-center text-white">
      {preview && <CameraPreview />}
      <div className="max-w-md">
        <h2 className="text-h4 font-semibold">{title}</h2>
        <p className="text-small mt-1 text-stone-300">{body}</p>
      </div>
      {children}
    </div>
  );
}

function CameraPreview() {
  const [stream, setStream] = useState<MediaStream>();
  const [failed, setFailed] = useState(() => !navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    let opened: MediaStream | undefined;
    let stopped = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        opened = s;
        setStream(s);
      })
      .catch(() => !stopped && setFailed(true));
    return () => {
      stopped = true;
      opened?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (failed) {
    return (
      <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg bg-stone-800 text-stone-300">
        <CameraOff className="size-8" aria-hidden />
        <p className="text-small">Camera not available. Allow camera access in your browser.</p>
      </div>
    );
  }

  return stream ? (
    <StreamVideo
      stream={stream}
      muted
      label="Your camera"
      className="aspect-video w-full max-w-sm -scale-x-100 rounded-lg bg-stone-800 object-cover"
    />
  ) : (
    <div className="aspect-video w-full max-w-sm rounded-lg bg-stone-800" />
  );
}
