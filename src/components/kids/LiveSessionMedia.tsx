"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  MonitorUp,
  Video,
  VideoOff,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  KIDS_LIVE_ICE_SERVERS,
  kidsLiveChannelName,
  shouldCreateOffer,
  type KidsLiveRole,
  type KidsLiveSignal,
} from "@/lib/kids/live";

type PresenceMeta = {
  name: string;
  role: KidsLiveRole;
};

type RemotePeer = {
  id: string;
  name: string;
  role: KidsLiveRole;
  stream: MediaStream | null;
};

export default function LiveSessionMedia({
  lessonId,
  displayName,
  role,
  active,
}: {
  lessonId: string;
  displayName: string;
  role: KidsLiveRole;
  active: boolean;
}) {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [remotes, setRemotes] = useState<RemotePeer[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  );
  const myIdRef = useRef<string>("");
  const namesRef = useRef<Map<string, PresenceMeta>>(new Map());

  const attachLocalVideo = useCallback((stream: MediaStream) => {
    const node = localVideoRef.current;
    if (node && node.srcObject !== stream) {
      node.srcObject = stream;
    }
  }, []);

  const sendSignal = useCallback((payload: KidsLiveSignal) => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({
      type: "broadcast",
      event: "signal",
      payload,
    });
  }, []);

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    setRemotes((current) => current.filter((peer) => peer.id !== peerId));
  }, []);

  const ensurePeer = useCallback(
    async (remoteId: string, initiate: boolean) => {
      const existing = peersRef.current.get(remoteId);
      if (existing) return existing;
      const localStream = localStreamRef.current;
      if (!localStream) return null;

      const pc = new RTCPeerConnection({ iceServers: KIDS_LIVE_ICE_SERVERS });
      peersRef.current.set(remoteId, pc);
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        sendSignal({
          type: "ice",
          from: myIdRef.current,
          to: remoteId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        const meta = namesRef.current.get(remoteId);
        setRemotes((current) => {
          const next = current.filter((peer) => peer.id !== remoteId);
          next.push({
            id: remoteId,
            name: meta?.name ?? "Participant",
            role: meta?.role ?? "family",
            stream,
          });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          closePeer(remoteId);
        }
      };

      if (initiate) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (pc.localDescription) {
          sendSignal({
            type: "offer",
            from: myIdRef.current,
            to: remoteId,
            sdp: pc.localDescription,
          });
        }
      }
      return pc;
    },
    [closePeer, sendSignal]
  );

  const handleSignal = useCallback(
    async (payload: KidsLiveSignal) => {
      if (payload.to !== myIdRef.current) return;
      const pc = await ensurePeer(payload.from, false);
      if (!pc) return;
      if (payload.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          sendSignal({
            type: "answer",
            from: myIdRef.current,
            to: payload.from,
            sdp: pc.localDescription,
          });
        }
      } else if (payload.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } else if (payload.type === "ice") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // Candidate may arrive before remote description.
        }
      }
    },
    [ensurePeer, sendSignal]
  );

  const leaveCall = useCallback(async () => {
    for (const peerId of [...peersRef.current.keys()]) {
      closePeer(peerId);
    }
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    const channel = channelRef.current;
    if (channel) {
      const supabase = createClient();
      await supabase.removeChannel(channel);
      channelRef.current = null;
    }
    setRemotes([]);
    setSharing(false);
    setJoined(false);
  }, [closePeer]);

  const joinCall = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in to join camera and microphone.");
      return;
    }
    myIdRef.current = user.id;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setCamOn(false);
      } catch {
        setError("Allow camera or microphone to join the live room.");
        return;
      }
    }

    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
    attachLocalVideo(stream);

    const channel = supabase.channel(kidsLiveChannelName(lessonId), {
      config: {
        broadcast: { self: false },
        presence: { key: user.id },
      },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      void handleSignal(payload as KidsLiveSignal);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceMeta>();
      const names = new Map<string, PresenceMeta>();
      for (const [key, metas] of Object.entries(state)) {
        const meta = metas[0];
        if (meta) names.set(key, { name: meta.name, role: meta.role });
      }
      namesRef.current = names;
      const liveIds = new Set(Object.keys(state));
      for (const peerId of [...peersRef.current.keys()]) {
        if (!liveIds.has(peerId)) closePeer(peerId);
      }
      for (const peerId of liveIds) {
        if (peerId === myIdRef.current) continue;
        if (shouldCreateOffer(myIdRef.current, peerId)) {
          void ensurePeer(peerId, true);
        }
      }
    });

    channel.on("presence", { event: "leave" }, ({ key }) => {
      if (key && key !== myIdRef.current) closePeer(key);
    });

    const status = await new Promise<string>((resolve) => {
      channel.subscribe((next) => {
        if (next === "SUBSCRIBED") resolve(next);
        if (next === "CHANNEL_ERROR" || next === "TIMED_OUT") resolve(next);
      });
    });

    if (status !== "SUBSCRIBED") {
      setError("Could not join the live room. Try again.");
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    await channel.track({ name: displayName, role });
    setJoined(true);
  }, [attachLocalVideo, closePeer, displayName, ensurePeer, handleSignal, lessonId, role]);

  useEffect(() => {
    if (!joined) return;
    const stream = localStreamRef.current;
    if (stream) attachLocalVideo(stream);
  }, [attachLocalVideo, joined]);

  useEffect(() => {
    if (!active && joined) {
      void leaveCall();
    }
  }, [active, joined, leaveCall]);

  useEffect(() => {
    return () => {
      void leaveCall();
    };
  }, [leaveCall]);

  async function toggleMic() {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  }

  async function toggleCam() {
    const next = !camOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCamOn(next);
  }

  async function toggleScreen() {
    if (sharing) {
      const camera = cameraTrackRef.current;
      for (const pc of peersRef.current.values()) {
        const sender = pc.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(camera);
      }
      if (localStreamRef.current && camera) {
        const old = localStreamRef.current.getVideoTracks()[0];
        if (old && old !== camera) localStreamRef.current.removeTrack(old);
        if (!localStreamRef.current.getVideoTracks().includes(camera)) {
          localStreamRef.current.addTrack(camera);
        }
        attachLocalVideo(localStreamRef.current);
      }
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      setSharing(false);
      return;
    }

    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const track = screen.getVideoTracks()[0];
      if (!track) return;
      screenTrackRef.current = track;
      for (const pc of peersRef.current.values()) {
        const sender = pc.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(track);
      }
      if (localStreamRef.current) {
        const current = localStreamRef.current.getVideoTracks()[0];
        if (current) localStreamRef.current.removeTrack(current);
        localStreamRef.current.addTrack(track);
        attachLocalVideo(localStreamRef.current);
      }
      track.onended = () => {
        void toggleScreen();
      };
      setSharing(true);
    } catch {
      setError("Screen sharing was cancelled or is not available.");
    }
  }

  if (!active) {
    return (
      <section className="rounded-xl border border-sky-200 bg-white p-6">
        <h2 className="font-semibold text-sky-900">Live room</h2>
        <p className="mt-2 text-sm text-stone-600">
          Voice, video, and screen sharing are available while the session is live.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Live room</h2>
      <p className="mt-1 text-sm text-stone-600">
        Join with camera and microphone, then share your screen when you teach.
      </p>
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!joined ? (
        <div className="mt-4">
          <Button type="button" onClick={() => void joinCall()}>
            Join with camera &amp; mic
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-xl border border-sky-100 bg-stone-900">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full object-cover"
              />
              <figcaption className="bg-stone-800 px-3 py-1.5 text-xs text-white">
                You · {displayName}
                {sharing ? " · sharing screen" : ""}
              </figcaption>
            </figure>
            {remotes.map((peer) => (
              <RemoteVideo key={peer.id} peer={peer} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void toggleMic()}>
              {micOn ? <Mic className="mr-1 h-4 w-4" /> : <MicOff className="mr-1 h-4 w-4" />}
              {micOn ? "Mute" : "Unmute"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void toggleCam()}>
              {camOn ? <Video className="mr-1 h-4 w-4" /> : <VideoOff className="mr-1 h-4 w-4" />}
              {camOn ? "Camera off" : "Camera on"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void toggleScreen()}>
              <MonitorUp className="mr-1 h-4 w-4" />
              {sharing ? "Stop sharing" : "Share screen"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => void leaveCall()}>
              <PhoneOff className="mr-1 h-4 w-4" />
              Leave call
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function RemoteVideo({ peer }: { peer: RemotePeer }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current && peer.stream) {
      ref.current.srcObject = peer.stream;
    }
  }, [peer.stream]);
  return (
    <figure className="overflow-hidden rounded-xl border border-sky-100 bg-stone-900">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="aspect-video w-full object-cover"
      />
      <figcaption className="bg-stone-800 px-3 py-1.5 text-xs text-white">
        {peer.name} · {peer.role === "teacher" ? "Teacher" : "Family"}
      </figcaption>
    </figure>
  );
}
