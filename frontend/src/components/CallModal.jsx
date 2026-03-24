import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import "./CallModal.css";

export default function CallModal({ call, onClose, isIncoming, localStream, peerConnection }) {
  const { socket } = useSocket();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callStatus, setCallStatus] = useState(isIncoming ? "incoming" : "calling");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setCallStatus("connected");
      }
    };
  }, [peerConnection]);

  const handleAccept = () => {
    setCallStatus("connected");
    socket?.emit("call_accepted", { to: call.from });
  };

  const handleReject = () => {
    socket?.emit("call_rejected", { to: call.from || call.to });
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMuted(m => !m);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCameraOff(c => !c);
    }
  };

  return (
    <div className="call-modal-overlay">
      <div className="call-modal">
        {call?.type === "video" ? (
          <div className="video-container">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          </div>
        ) : (
          <div className="audio-call-ui">
            <div className="call-avatar" style={{ background: call?.avatarColor || "#00a884" }}>
              {call?.username?.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="call-username">{call?.username}</h2>
            <p className="call-status-text">
              {callStatus === "incoming" ? "Incoming call..." :
               callStatus === "calling" ? "Calling..." : "Connected"}
            </p>
          </div>
        )}

        <div className="call-controls">
          {isIncoming && callStatus === "incoming" ? (
            <>
              <button className="call-btn accept" onClick={handleAccept}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                </svg>
              </button>
              <button className="call-btn reject" onClick={handleReject}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19.59 7l-7.59 7.59L4.41 7 3 8.41l7.59 7.59L3 23.59 4.41 25 12 17.41 19.59 25 21 23.59 13.41 16 21 8.41z"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button className={`call-btn ${muted ? "active" : ""}`} onClick={toggleMute}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  {muted
                    ? <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                    : <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  }
                </svg>
              </button>
              {call?.type === "video" && (
                <button className={`call-btn ${cameraOff ? "active" : ""}`} onClick={toggleCamera}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                </button>
              )}
              <button className="call-btn reject" onClick={handleReject}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}