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
        console.log('Initializing player for channel:', channel.name);
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          console.error('Browser not supported!');
          return;
        }

        // Clean up existing player
        if (playerRef.current) {
          console.log('Cleaning up existing player');
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
          console.log('Configuring DRM for channel:', channel.name);
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
          console.log('Loading manifest for channel:', channel.name);
          await player.load(channel.manifestUri);
          
          // Set muted to true initially to allow autoplay
          video.muted = true;

          try {
            await video.play();
            // After successful autoplay, unmute if possible
            video.muted = false;
          } catch (error) {
            console.log('Autoplay failed, keeping video muted:', error);
            // Keep video muted if autoplay fails
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
