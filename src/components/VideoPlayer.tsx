import { useEffect, useRef } from 'react';
// @ts-ignore
import shaka from 'shaka-player';
import type { Channel } from './Sidebar';

interface VideoPlayerProps {
  channel: Channel;
}

const VideoPlayer = ({ channel }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    let player: shaka.Player | null = null;

    const initPlayer = async () => {
      try {
        // Install polyfills only once
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          console.error('Browser not supported!');
          return;
        }

        // Clean up existing player
        if (playerRef.current) {
          await playerRef.current.destroy();
          playerRef.current = null;
        }

        // Reset video element state
        video.src = '';
        video.load();

        // Create and attach new player
        player = new shaka.Player();
        await player.attach(video);
        playerRef.current = player;

        // Configure DRM if needed
        if (channel.clearKey) {
          player.configure({ 
            drm: { 
              clearKeys: channel.clearKey,
              retryParameters: {
                maxAttempts: 3,
                baseDelay: 1000,
                backoffFactor: 2
              }
            }
          });
        }

        if (channel.type === 'youtube') return;

        if (channel.manifestUri) {
          await player.load(channel.manifestUri);
          
          // Ensure video element is ready before playing
          if (video.readyState >= 2) {
            await video.play();
          } else {
            video.addEventListener('loadeddata', async () => {
              try {
                await video.play();
              } catch (error) {
                console.error('Error playing video after load:', error);
              }
            }, { once: true });
          }
        }
      } catch (error) {
        console.error('Error initializing player:', error);
      }
    };

    initPlayer();

    // Cleanup function
    return () => {
      const cleanup = async () => {
        try {
          if (playerRef.current) {
            await playerRef.current.destroy();
            playerRef.current = null;
          }
          video.src = '';
          video.load();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      };
      cleanup();
    };
  }, [channel]);

  if (channel.type === 'youtube') {
    return (
      <div className="w-full h-screen bg-black">
        <iframe
          src={`${channel.embedUrl}&autoplay=1&mute=0`}
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
        autoPlay
      />
    </div>
  );
};

export default VideoPlayer;
