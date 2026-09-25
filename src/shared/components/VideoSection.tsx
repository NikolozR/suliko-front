"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/features/ui";
import { useAutoplay } from "@/shared/components/landing/useAutoplay";

export default function VideoSection() {
  const t = useTranslations("VideoSection");
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const { ref: sectionRef, running } = useAutoplay<HTMLElement>();
  // Set once the visitor pauses by hand, so scrolling back doesn't restart it.
  const pausedByUser = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Plays muted and on a loop while on screen, like the rest of the page.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (running && !pausedByUser.current) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (!running && !video.paused) {
      video.pause();
      setIsPlaying(false);
    }
    // isMuted is applied by toggleMute; only visibility should start or stop playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      pausedByUser.current = true;
      setIsPlaying(false);
    } else {
      pausedByUser.current = false;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Guard against NaN when duration is 0 before video loads
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section id="video" ref={sectionRef} className="scroll-mt-24 py-20 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div data-reveal className="max-w-5xl mx-auto">
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                poster="/video-poster.png"
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src="/api/video2" type="video/mp4" />
                {t("browserNotSupported")}
              </video>

              {/* Centered play button overlay — shown when video is paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  aria-label="Play video"
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play className="h-7 w-7 text-white fill-white ml-1" />
                  </div>
                </button>
              )}

              {/* Custom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-3">
                  <input
                    ref={progressRef}
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer video-slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%, rgba(255,255,255,0.3) 100%)`
                    }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20 p-2"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Time Display */}
                    <span className="text-white text-sm font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Volume Control */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20 p-2"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer video-slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                      }}
                    />

                    {/* Fullscreen Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20 p-2"
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
