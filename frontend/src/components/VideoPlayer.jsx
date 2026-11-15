import { useEffect, useRef, useState } from "react";

const QUALITIES = ["Auto", "1080p", "720p", "480p"];

// NOTE: real adaptive streaming (HLS/MPEG-DASH per the requirements doc)
// needs a manifest-aware player (e.g. hls.js) talking to a real encoding
// pipeline. This mock swaps the "quality" label only, since there's just one
// demo video file to play — wire the QUALITIES buttons to real renditions
// once the backend serves them.
function VideoPlayer({ videoUrl, poster, startAt = 0, onProgress }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [quality, setQuality] = useState("Auto");
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Resume from where the viewer left off (section 5: Watchlist and History)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleLoadedMetadata() {
      if (startAt > 0 && startAt < video.duration) {
        video.currentTime = startAt;
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [startAt]);

  // Keep the caption track's showing/hidden state in sync with the toggle
  useEffect(() => {
    const track = videoRef.current?.textTracks?.[0];
    if (track) {
      track.mode = captionsOn ? "showing" : "hidden";
    }
  }, [captionsOn]);

  function handleTimeUpdate() {
    if (onProgress && videoRef.current) {
      onProgress(videoRef.current.currentTime);
    }
  }

  function handleFullscreen() {
    videoRef.current?.requestFullscreen?.();
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-player"
        controls
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
      >
        <source src={videoUrl} />
        <track ref={trackRef} kind="captions" label="English" srcLang="en" default />
        Your browser does not support video playback.
      </video>

      <div className="player-extra-controls">
        <button
          className={`player-pill ${captionsOn ? "active" : ""}`}
          onClick={() => setCaptionsOn((v) => !v)}
        >
          <i class="fa-solid fa-closed-captioning"></i> {captionsOn ? "On" : "Off"}
        </button>

        <div className="quality-picker">
          <button className="player-pill" onClick={() => setShowQualityMenu((v) => !v)}>
            {quality} <i class="fa-solid fa-angle-down"></i>
          </button>

          {showQualityMenu && (
            <div className="quality-menu">
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  className={q === quality ? "active" : ""}
                  onClick={() => {
                    setQuality(q);
                    setShowQualityMenu(false);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="player-pill" onClick={handleFullscreen}>
          ⛶ Fullscreen
        </button>
      </div>
    </div>
  );
}

export default VideoPlayer;
