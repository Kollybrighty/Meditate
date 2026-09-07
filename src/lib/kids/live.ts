export const KIDS_LIVE_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
    ],
  },
];

export function kidsLiveChannelName(lessonId: string): string {
  return `kids-live:${lessonId}`;
}

export function shouldCreateOffer(localPeerId: string, remotePeerId: string): boolean {
  return localPeerId > remotePeerId;
}

export type KidsLiveRole = "teacher" | "family";

export type KidsLiveSignal =
  | {
      type: "offer" | "answer";
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice";
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    };
