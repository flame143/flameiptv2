import { useEffect, useRef } from 'react';
import shaka from 'shaka-player';

interface Channel {
  name: string;
  manifestUri: string;
  type: string;
  clearKey?: {
    [key: string]: string;
  };
  embedUrl?: string;
  logo: string;
}

interface VideoPlayerProps {
  channel: Channel;
}

const VideoPlayer = ({ channel }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const initPlayer = async () => {
      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported()) {
        try {
          if (playerRef.current) {
            await playerRef.current.destroy();
          }

          const video = videoRef.current!;
          const player = new shaka.Player(video);
          playerRef.current = player;

          if (channel.clearKey) {
            const clearKeyConfig = {
              keySystem: 'org.w3.clearkey',
              licenseServerUri: '',
              clearKeys: channel.clearKey
            };
            player.configure({ drm: { clearKeys: channel.clearKey } });
          }

          if (channel.type === 'youtube') {
            return; // Handle YouTube separately
          }

          await player.load(channel.manifestUri);
          video.play();
        } catch (error) {
          console.error('Error loading video:', error);
        }
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [channel]);

  if (channel.type === 'youtube') {
    return (
      <div className="w-full h-screen bg-black">
        <iframe
          src={channel.embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;