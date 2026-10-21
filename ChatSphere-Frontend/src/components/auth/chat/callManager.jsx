import { useEffect, useRef, useState } from "react";
import {
  connectSocket,
  getSocket,
} from "../../../services/socket";

function makeCallId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getOtherParticipant(
  conversation,
  currentUserId
) {
  return conversation?.participants?.find(
    (participant) =>
      String(participant._id) !==
      String(currentUserId)
  );
}

function CallManager({
  conversation,
  currentUserId,
  requestCall,
  onRequestHandled,
}) {
  const [call, setCall] = useState(null);
  const [error, setError] = useState("");
  const [groupRemoteStreams, setGroupRemoteStreams] =
  useState([]);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const groupPeersRef = useRef(new Map());
  const groupPendingIceRef = useRef(new Map());
  const callRef = useRef(null);
  const pendingIceRef = useRef([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // --------------------------------------------------
  // CLEANUP MEDIA
  // --------------------------------------------------

  const cleanupMedia = () => {
    // Close all group-call peer connections
    groupPeersRef.current.forEach((peer) => {
      try {
        peer.close();
      } catch (error) {
        console.error(
          "Group peer cleanup error:",
          error
        );
      }
    });

    groupPeersRef.current.clear();
    groupPendingIceRef.current.clear();

    setGroupRemoteStreams([]);
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    localStreamRef.current = null;

    remoteStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    remoteStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingIceRef.current = [];
  };

  // --------------------------------------------------
  // END CALL
  // --------------------------------------------------

  const finishCall = ({ notifyPeer = true } = {}) => {
    const activeCall = callRef.current;

    const socket =
      getSocket() || connectSocket();

    if (
      notifyPeer &&
      activeCall?.receiverId &&
      activeCall?.callId &&
      socket
    ) {
      socket.emit("callEnded", {
        receiverId: activeCall.receiverId,
        callId: activeCall.callId,
      });
    }

    cleanupMedia();

    callRef.current = null;
    setCall(null);
    setError("");
  };

  // --------------------------------------------------
  // PENDING ICE CANDIDATES
  // --------------------------------------------------

  const addPendingIceCandidates = async (
    peer
  ) => {
    const pending =
      pendingIceRef.current.splice(0);

    for (const candidate of pending) {
      try {
        await peer.addIceCandidate(
          candidate
        );
      } catch (error) {
        console.error(
          "Pending ICE candidate error:",
          error
        );
      }
    }
  };

  // --------------------------------------------------
  // CREATE WEBRTC PEER
  // --------------------------------------------------

  const createPeer = async ({
    callType,
    receiverId,
    callId,
  }) => {
    const peer =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
          {
            urls:
              "stun:stun1.l.google.com:19302",
          },
        ],
      });

    // ICE candidate
    peer.onicecandidate = (event) => {
      if (!event.candidate) return;

      const socket =
        getSocket() || connectSocket();

      socket?.emit("iceCandidate", {
        receiverId,
        callId,
        candidate: event.candidate,
      });
    };

    // Remote stream
    peer.ontrack = (event) => {
      const [stream] = event.streams;

      if (!stream) return;

      remoteStreamRef.current = stream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          stream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject =
          stream;
      }
    };

    peer.onconnectionstatechange = () => {
      if (
        [
          "failed",
          "disconnected",
          "closed",
        ].includes(peer.connectionState)
      ) {
        finishCall({
          notifyPeer:
            peer.connectionState !==
            "closed",
        });
      }
    };

    // Browser microphone/camera permission
    const media =
      await navigator.mediaDevices.getUserMedia(
        {
          audio: true,
          video: callType === "video",
        }
      );

    localStreamRef.current = media;

    media
      .getTracks()
      .forEach((track) => {
        peer.addTrack(track, media);
      });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        media;
    }

    peerRef.current = peer;

    return peer;
  };
  // --------------------------------------------------
  // CREATE GROUP WEBRTC PEER
  // --------------------------------------------------

  const createGroupPeer = async ({
    participantId,
    callType,
    callId,
    createOffer = false,
  }) => {
    const socket =
      getSocket() || connectSocket();

    if (!socket) {
      throw new Error(
        "Call connection is not available."
      );
    }

    const peer =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
          {
            urls:
              "stun:stun1.l.google.com:19302",
          },
        ],
      });

    const participantKey =
      String(participantId);

    groupPeersRef.current.set(
      participantKey,
      peer
    );

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;

      socket.emit("groupIceCandidate", {
        receiverId: participantKey,
        senderId: String(currentUserId),
        callId,
        candidate: event.candidate,
      });
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;

      if (!stream) return;

      setGroupRemoteStreams((prev) => {
        const existing = prev.find(
          (item) =>
            String(item.participantId) ===
            participantKey
        );

        if (existing) {
          return prev.map((item) =>
            String(item.participantId) ===
            participantKey
              ? {
                  ...item,
                  stream,
                }
              : item
          );
        }

        return [
          ...prev,
          {
            participantId:
              participantKey,
            stream,
          },
        ];
      });
    };

    peer.onconnectionstatechange = () => {
      if (
        ["failed", "disconnected", "closed"].includes(
          peer.connectionState
        )
      ) {
        groupPeersRef.current.delete(
          participantKey
        );

        setGroupRemoteStreams((prev) =>
          prev.filter(
            (item) =>
              String(item.participantId) !==
              participantKey
          )
        );
      }
    };

    // Get microphone/camera only once.
    if (!localStreamRef.current) {
      const media =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });

      localStreamRef.current = media;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          media;
      }
    }

    localStreamRef.current
      .getTracks()
      .forEach((track) => {
        peer.addTrack(
          track,
          localStreamRef.current
        );
      });

    // Caller creates an offer for this participant.
    if (createOffer) {
      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      socket.emit("groupWebrtcOffer", {
        receiverId: participantKey,
        senderId: String(currentUserId),
        callId,
        offer,
      });
    }

    return peer;
  };
  // --------------------------------------------------
  // START OUTGOING CALL
  // --------------------------------------------------

  const startCall = async (request) => {
    if (!conversation) return;

    const callType =
      typeof request === "string"
        ? request
        : request?.type;

    const requestedReceiverId =
      typeof request === "object"
        ? request?.receiverId
        : null;

    if (callRef.current) return;

    const socket =
      getSocket() || connectSocket();

    if (!socket) {
      setError(
        "Call connection is not available."
      );
      return;
    }

    // ==================================================
    // GROUP CALL
    // ==================================================
    if (conversation.isGroup) {
      const participantIds =
        conversation.participants
          ?.filter(
            (participant) =>
              String(participant._id) !==
              String(currentUserId)
          )
          .map((participant) =>
            String(participant._id)
          ) || [];

      if (participantIds.length === 0) {
        setError(
          "No other group members are available."
        );
        return;
      }

      const callId = makeCallId();

      const activeCall = {
        callId,
        callerId:
          String(currentUserId),
        receiverId: null,
        participantIds,
        callType,
        role: "caller",
        isGroup: true,
        status: "calling",
      };

      callRef.current = activeCall;

      setCall({
        ...activeCall,
        name:
          conversation.name ||
          "Group call",
      });

      setError("");

      socket.emit("groupCallStart", {
        conversationId:
          conversation._id,
        callId,
        callerId:
          String(currentUserId),
        callType,
        participantIds,
      });

      return;
    }

    // ==================================================
    // DIRECT CALL
    // ==================================================

    const other =
      getOtherParticipant(
        conversation,
        currentUserId
      );

    if (!other?._id) {
      setError(
        "Unable to find the other participant."
      );
      return;
    }

    const callId = makeCallId();

    const receiverId =
      String(other._id);

    setError("");

    try {
      const peer =
        await createPeer({
          callType,
          receiverId,
          callId,
        });

      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      const activeCall = {
        callId,
        callerId:
          String(currentUserId),
        receiverId,
        callType,
        role: "caller",
      };

      callRef.current =
        activeCall;

      setCall({
        ...activeCall,
        status: "calling",
        name: other.name,
      });

      socket.emit("callUser", {
        receiverId,
        callId,
        callType,
        offer,
      });
    } catch (error) {
      console.error(
        "Start call error:",
        error
      );

      cleanupMedia();

      callRef.current = null;

      setError(
        "Could not access your microphone/camera. Please check browser permissions."
      );
    }
  };

  // --------------------------------------------------
  // ACCEPT INCOMING CALL
  // --------------------------------------------------
  const acceptGroupCall = async () => {
    const incoming =
      callRef.current;

    if (!incoming?.isGroup) return;

    const socket =
      getSocket() || connectSocket();

    if (!socket) {
      setError(
        "Call connection is not available."
      );
      return;
    }

    try {
      const media =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video:
            incoming.callType === "video",
        });

      localStreamRef.current =
        media;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          media;
      }

      socket.emit(
        "groupCallAccept",
        {
          conversationId:
            conversation?._id,
          callId:
            incoming.callId,
          callerId:
            incoming.callerId,
          callType:
            incoming.callType,
          participantIds:
            incoming.participantIds || [],
        }
      );

      const nextCall = {
        ...incoming,
        role: "receiver",
        status: "connected",
        isGroup: true,
      };

      callRef.current =
        nextCall;

      setCall(nextCall);
      setError("");
    } catch (error) {
      console.error(
        "Accept group call error:",
        error
      );

      cleanupMedia();

      socket.emit(
        "groupCallReject",
        {
          conversationId:
            conversation?._id,
          callId:
            incoming.callId,
          callerId:
            incoming.callerId,
        }
      );

      callRef.current = null;
      setCall(null);

      setError(
        "Could not access your microphone/camera."
      );
    }
  };
  const acceptCall = async () => {
    const incoming =
      callRef.current;

    if (
      incoming?.isGroup
    ) {
      return acceptGroupCall();
    }

    if (!incoming?.offer) return;

    const socket =
      getSocket() || connectSocket();

    if (!socket) return;

    try {
      const peer = await createPeer({
        callType:
          incoming.callType,
        receiverId:
          incoming.callerId,
        callId:
          incoming.callId,
      });

      // Apply caller's offer
      await peer.setRemoteDescription(
        incoming.offer
      );

      await addPendingIceCandidates(
        peer
      );

      const answer =
        await peer.createAnswer();

      await peer.setLocalDescription(
        answer
      );

      // Backend:
      // socket.on("callAccepted", ...)
      socket.emit("callAccepted", {
        callerId:
          incoming.callerId,
        callId:
          incoming.callId,
        answer,
      });

      const nextCall = {
        ...incoming,
        role: "receiver",
        status: "connected",
      };

      callRef.current = nextCall;

      setCall(nextCall);
    } catch (error) {
      console.error(
        "Accept call error:",
        error
      );

      socket.emit("callRejected", {
        callerId:
          incoming.callerId,
        callId:
          incoming.callId,
      });

      finishCall({
        notifyPeer: false,
      });

      setError(
        "Could not access your microphone/camera."
      );
    }
  };

  // --------------------------------------------------
  // REJECT CALL
  // --------------------------------------------------

  const rejectCall = () => {
    const incoming =
      callRef.current;

    const socket =
      getSocket() || connectSocket();

    if (
      incoming?.callerId &&
      incoming?.callId
    ) {
      socket?.emit("callRejected", {
        callerId:
          incoming.callerId,
        callId:
          incoming.callId,
      });
    }

    finishCall({
      notifyPeer: false,
    });
  };

  // --------------------------------------------------
  // CALL BUTTON TRIGGER
  // --------------------------------------------------

  useEffect(() => {
    if (!requestCall) return;

    startCall(requestCall);

    onRequestHandled?.();

    // requestCall is deliberately used
    // as the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestCall]);

  // --------------------------------------------------
  // SOCKET EVENTS
  // --------------------------------------------------

  useEffect(() => {
    const socket =
      getSocket() || connectSocket();

    if (!socket) return undefined;

    // Incoming call
    const handleIncomingCall = (
      data
    ) => {
      if (callRef.current) {
        socket.emit("callBusy", {
          callerId:
            data.callerId,
          callId:
            data.callId,
        });

        return;
      }

      const incoming = {
        callId:
          data.callId,

        callerId:
          String(data.callerId),

        receiverId:
          String(data.receiverId),

        callType:
          data.callType,

        offer:
          data.offer,

        role: "receiver",

        status: "incoming",

        name: "Incoming call",
      };

      callRef.current = incoming;

      setCall(incoming);
    };

    // Caller receives answer
    const handleAccepted = async (
      data
    ) => {
      const active =
        callRef.current;

      const peer =
        peerRef.current;

      if (
        !active ||
        active.callId !==
          data.callId ||
        !peer
      ) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          data.answer
        );

        await addPendingIceCandidates(
          peer
        );

        setCall((prev) =>
          prev
            ? {
                ...prev,
                status:
                  "connected",
              }
            : prev
        );
      } catch (error) {
        console.error(
          "Call answer error:",
          error
        );

        finishCall();
      }
    };

    // ICE candidate
    const handleIceCandidate =
      async (data) => {
        const active =
          callRef.current;

        const peer =
          peerRef.current;

        if (
          !active ||
          active.callId !==
            data.callId ||
          !data.candidate
        ) {
          return;
        }

        if (peer?.remoteDescription) {
          try {
            await peer.addIceCandidate(
              data.candidate
            );
          } catch (error) {
            console.error(
              "ICE candidate error:",
              error
            );
          }
        } else {
          pendingIceRef.current.push(
            data.candidate
          );
        }
      };

    // Rejected
    const handleRejected = ({
      callId,
      message,
    }) => {
      if (
        callRef.current?.callId !==
        callId
      ) {
        return;
      }

      setError(
        message || "Call rejected"
      );

      finishCall({
        notifyPeer: false,
      });
    };

    // Offline
    const handleUnavailable = ({
      callId,
      message,
    }) => {
      if (
        callRef.current?.callId !==
        callId
      ) {
        return;
      }

      setError(
        message ||
          "User is offline"
      );

      finishCall({
        notifyPeer: false,
      });
    };

    // Busy
    const handleBusy = ({
      callId,
      message,
    }) => {
      if (
        callRef.current?.callId !==
        callId
      ) {
        return;
      }

      setError(
        message ||
          "User is busy"
      );

      finishCall({
        notifyPeer: false,
      });
    };

    // Other user ended call
    const handleEnded = ({
      callId,
    }) => {
      if (
        callRef.current?.callId !==
        callId
      ) {
        return;
      }

      finishCall({
        notifyPeer: false,
      });
    };

    // Optional WebRTC renegotiation
    const handleOffer = async (
      data
    ) => {
      const active =
        callRef.current;

      const peer =
        peerRef.current;

      if (
        !active ||
        active.callId !==
          data.callId ||
        !peer ||
        active.status !==
          "connected"
      ) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          data.offer
        );

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        socket.emit("webrtcAnswer", {
          receiverId:
            data.senderId,
          callId:
            data.callId,
          answer,
        });
      } catch (error) {
        console.error(
          "WebRTC offer error:",
          error
        );
      }
    };

    // Optional WebRTC renegotiation
    const handleAnswer = async (
      data
    ) => {
      const active =
        callRef.current;

      const peer =
        peerRef.current;

      if (
        !active ||
        active.callId !==
          data.callId ||
        !peer ||
        !data.answer
      ) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          data.answer
        );

        await addPendingIceCandidates(
          peer
        );
      } catch (error) {
        console.error(
          "WebRTC answer error:",
          error
        );
      }
    };

    socket.on(
      "incomingCall",
      handleIncomingCall
    );
    const handleGroupIncomingCall = (data) => {
      if (!data) return;

      const {
        conversationId,
        callId,
        callerId,
        callType,
        participantIds,
      } = data;
    
      if (
        String(conversation?._id) !==
        String(conversationId)
      ) {
        return;
      }
    
      if (
        !Array.isArray(participantIds) ||
        participantIds.length === 0
      ) {
        return;
      }
    
      callRef.current = {
        callId,
        callerId:
          String(callerId),
        receiverId: null,
        participantIds:
          participantIds.map((id) =>
            String(id)
          ),
        callType,
        role: "receiver",
        isGroup: true,
        status: "incoming",
      };
    
      setCall({
        ...callRef.current,
        status: "incoming",
        name:
          conversation?.name ||
          "Incoming group call",
      });
    
      setError("");
    };
    const handleGroupCallAccepted = async (data) => {
      if (!data) return;

      const {
        conversationId,
        callId,
        receiverId,
        callType,
      } = data;
    
      if (
        String(conversation?._id) !==
        String(conversationId)
      ) {
        return;
      }
    
      const activeCall =
        callRef.current;
    
      if (
        !activeCall ||
        String(activeCall.callId) !==
          String(callId)
      ) {
        return;
      }
    
      const participantId =
        String(receiverId);
    
      // Don't create a peer connection to ourselves.
      if (
        participantId ===
        String(currentUserId)
      ) {
        return;
      }
    
      // Don't create duplicate peer connections.
      if (
        groupPeersRef.current.has(
          participantId
        )
      ) {
        return;
      }
    
      try {
        await createGroupPeer({
          participantId,
          callType:
            callType ||
            activeCall.callType,
          callId,
          createOffer: true,
        });
      
        setCall((prev) =>
          prev
            ? {
                ...prev,
                status: "connected",
                isGroup: true,
              }
            : prev
        );
      } catch (error) {
        console.error(
          "Group peer creation error:",
          error
        );
      
        setError(
          "Unable to connect to the group call."
        );
      }
    };
    const handleGroupWebrtcOffer = async (data) => {
      if (!data) return;

      const {
        conversationId,
        callId,
        senderId,
        offer,
      } = data;
    
      if (
        String(conversation?._id) !==
        String(conversationId)
      ) {
        return;
      }
    
      const activeCall =
        callRef.current;
    
      if (
        !activeCall ||
        String(activeCall.callId) !==
          String(callId) ||
        !activeCall.isGroup
      ) {
        return;
      }
    
      const participantId =
        String(senderId);
    
      try {
        let peer =
          groupPeersRef.current.get(
            participantId
          );
        
        // Create a peer if this is the
        // first offer from this participant.
        if (!peer) {
          peer = await createGroupPeer({
            participantId,
            callType:
              activeCall.callType,
            callId,
            createOffer: false,
          });
        }
      
        await peer.setRemoteDescription(
          offer
        );
      
        const pendingCandidates =
          groupPendingIceRef.current.get(
            participantId
          ) || [];
        
        for (const candidate of pendingCandidates) {
          try {
            await peer.addIceCandidate(
              candidate
            );
          } catch (error) {
            console.error(
              "Group pending ICE error:",
              error
            );
          }
        }
      
        groupPendingIceRef.current.delete(
          participantId
        );
      
        const answer =
          await peer.createAnswer();
      
        await peer.setLocalDescription(
          answer
        );
      
        const socket =
          getSocket() || connectSocket();
      
        if (!socket) return;
      
        socket.emit(
          "groupWebrtcAnswer",
          {
            receiverId:
              participantId,
            senderId:
              String(currentUserId),
            callId,
            answer,
          }
        );
      } catch (error) {
        console.error(
          "Group WebRTC offer error:",
          error
        );
      }
    };
    const handleGroupWebrtcAnswer = async (data) => {
      if (!data) return;

      const {
        conversationId,
        callId,
        senderId,
        answer,
      } = data;
    
      if (
        String(conversation?._id) !==
        String(conversationId)
      ) {
        return;
      }
    
      const activeCall =
        callRef.current;
    
      if (
        !activeCall ||
        String(activeCall.callId) !==
          String(callId) ||
        !activeCall.isGroup
      ) {
        return;
      }
    
      const participantId =
        String(senderId);
    
      const peer =
        groupPeersRef.current.get(
          participantId
        );
      
      if (!peer) {
        console.warn(
          "Group peer not found for answer:",
          participantId
        );
        return;
      }
    
      try {
        await peer.setRemoteDescription(
          answer
        );
      } catch (error) {
        console.error(
          "Group WebRTC answer error:",
          error
        );
      }
    };
    const handleGroupIceCandidate = async (data) => {
      if (!data) return;

      const {
        callId,
        senderId,
        candidate,
      } = data;
    
      if (!callId || !senderId || !candidate) {
        return;
      }
    
      const activeCall = callRef.current;
    
      if (
        !activeCall ||
        String(activeCall.callId) !==
          String(callId) ||
        !activeCall.isGroup
      ) {
        return;
      }
    
      const participantId =
        String(senderId);
    
      const peer =
        groupPeersRef.current.get(
          participantId
        );
      
      // Peer may not exist yet because the
      // ICE candidate can arrive before the
      // WebRTC offer.
      if (!peer) {
        const pending =
          groupPendingIceRef.current.get(
            participantId
          ) || [];
        
        pending.push(candidate);
        
        groupPendingIceRef.current.set(
          participantId,
          pending
        );
      
        return;
      }
    
      try {
        // If remote description is not ready yet,
        // store the candidate temporarily.
        if (!peer.remoteDescription) {
          const pending =
            groupPendingIceRef.current.get(
              participantId
            ) || [];
          
          pending.push(candidate);
          
          groupPendingIceRef.current.set(
            participantId,
            pending
          );
        
          return;
        }
      
        await peer.addIceCandidate(
          candidate
        );
      } catch (error) {
        console.error(
          "Group ICE candidate error:",
          error
        );
      }
    };

    socket.on(
      "groupIncomingCall",
      handleGroupIncomingCall
    );

    socket.on(
      "groupCallAccepted",
      handleGroupCallAccepted
    );

    socket.on(
      "callAccepted",
      handleAccepted
    );

    socket.on(
      "callRejected",
      handleRejected
    );

    socket.on(
      "callUnavailable",
      handleUnavailable
    );

    socket.on(
      "callBusy",
      handleBusy
    );

    socket.on(
      "callEnded",
      handleEnded
    );

    socket.on(
      "iceCandidate",
      handleIceCandidate
    );

    socket.on(
      "webrtcOffer",
      handleOffer
    );
    socket.on(
      "groupWebrtcOffer",
      handleGroupWebrtcOffer
    );

    socket.on(
      "webrtcAnswer",
      handleAnswer
    );
    socket.on(
      "groupWebrtcAnswer",
      handleGroupWebrtcAnswer
    );
    socket.on(
      "groupIceCandidate",
      handleGroupIceCandidate
    );

    return () => {
      socket.off(
        "incomingCall",
        handleIncomingCall
      );
      socket.off(
        "groupIncomingCall",
        handleGroupIncomingCall
      );
      socket.off(
        "groupCallAccepted",
        handleGroupCallAccepted
      );

      socket.off(
        "callAccepted",
        handleAccepted
      );

      socket.off(
        "callRejected",
        handleRejected
      );

      socket.off(
        "callUnavailable",
        handleUnavailable
      );

      socket.off(
        "callBusy",
        handleBusy
      );

      socket.off(
        "callEnded",
        handleEnded
      );

      socket.off(
        "iceCandidate",
        handleIceCandidate
      );

      socket.off(
        "webrtcOffer",
        handleOffer
      );
      socket.off(
        "groupWebrtcOffer",
        handleGroupWebrtcOffer
      );

      socket.off(
        "webrtcAnswer",
        handleAnswer
      );
      socket.off(
        "groupWebrtcAnswer",
        handleGroupWebrtcAnswer
      );
      socket.off(
        "groupIceCandidate",
        handleGroupIceCandidate
      );
    };
  }, []);

  // Cleanup when Chat page closes
  useEffect(() => {
    return () => {
      cleanupMedia();
      callRef.current = null;
    };
  }, []);

  // Attach streams after UI appears
  useEffect(() => {
    if (!call) return;

    if (
      localVideoRef.current &&
      localStreamRef.current
    ) {
      localVideoRef.current.srcObject =
        localStreamRef.current;
    }

    if (
      remoteVideoRef.current &&
      remoteStreamRef.current
    ) {
      remoteVideoRef.current.srcObject =
        remoteStreamRef.current;
    }

    if (
      remoteAudioRef.current &&
      remoteStreamRef.current
    ) {
      remoteAudioRef.current.srcObject =
        remoteStreamRef.current;
    }
  }, [call]);

  if (!call && !error) {
    return null;
  }

  return (
    <>
      {/* CALL WINDOW */}
      {call && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-900 text-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="font-semibold">
                  {call.status ===
                  "incoming"
                    ? `${
                        call.callType ===
                        "video"
                          ? "📹"
                          : "📞"
                      } Incoming ${
                        call.callType
                      } call`
                    : `${
                        call.callType ===
                        "video"
                          ? "📹"
                          : "📞"
                      } ${
                        call.status ===
                        "calling"
                          ? "Calling"
                          : "Call"
                      }`}
                </h3>

                <p className="text-sm text-gray-300">
                  {call.name ||
                    "ChatSphere user"}
                </p>
              </div>

              {call.status !==
                "incoming" && (
                <span className="text-xs text-gray-400">
                  {call.status ===
                  "connected"
                    ? "Connected"
                    : "Ringing…"}
                </span>
              )}
            </div>

            {/* Incoming call */}
            {call.status ===
            "incoming" ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-5">
                  {call.callType ===
                  "video"
                    ? "📹"
                    : "📞"}
                </div>

                <p className="text-lg mb-6">
                  Someone is calling
                  you.
                </p>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={rejectCall}
                    className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </button>

                  <button
                    onClick={acceptCall}
                    className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video bg-black">

                {/* VIDEO CALL */}
                {call.callType === "video" ? (
                  <>
                    {call.isGroup ? (
                      <div className="grid h-full w-full grid-cols-1 gap-2 bg-black p-2 sm:grid-cols-2">
                        {groupRemoteStreams.length > 0 ? (
                          groupRemoteStreams.map((item) => (
                            <video
                              key={item.participantId}
                              autoPlay
                              playsInline
                              ref={(element) => {
                                if (element && item.stream) {
                                  element.srcObject =
                                    item.stream;
                                }
                              }}
                              className="h-full min-h-[180px] w-full rounded-xl bg-gray-800 object-cover"
                            />
                          ))
                        ) : (
                          <div className="col-span-full flex items-center justify-center text-gray-400">
                            Waiting for other participants...
                          </div>
                        )}
                
                        {/* Local video */}
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="absolute bottom-4 right-4 h-24 w-32 rounded-xl border border-white/30 bg-black object-cover"
                        />
                      </div>
                    ) : (
                      <>
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="absolute bottom-4 right-4 h-24 w-32 rounded-xl border border-white/30 bg-black object-cover"
                        />
                      </>
                    )}
                  </>
                ) : (
                  /* VOICE CALL */
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    {call.isGroup ? (
                      <>
                        <div className="text-6xl">
                          👥
                        </div>
                    
                        <p className="text-lg font-semibold">
                          Group voice call
                        </p>
                    
                        <p className="text-sm text-gray-400">
                          {groupRemoteStreams.length} participant
                          {groupRemoteStreams.length === 1
                            ? ""
                            : "s"} connected
                        </p>
                          
                        {groupRemoteStreams.map((item) => (
                          <audio
                            key={item.participantId}
                            autoPlay
                            ref={(element) => {
                              if (element && item.stream) {
                                element.srcObject =
                                  item.stream;
                              }
                            }}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl">
                          📞
                        </div>
                    
                        <audio
                          ref={remoteAudioRef}
                          autoPlay
                        />
                      </>
                    )}
                  </div>
                )}

                {/* END CALL */}
                <button
                  onClick={() =>
                    finishCall()
                  }
                  className="absolute left-1/2 -translate-x-1/2 bottom-6 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-xl"
                  title="End call"
                >
                  ☎
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && !call && (
        <div className="fixed bottom-5 right-5 z-[110] max-w-sm rounded-xl bg-red-600 text-white px-4 py-3 shadow-xl flex items-center gap-3">
          <span className="flex-1 text-sm">
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
            className="font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export default CallManager;