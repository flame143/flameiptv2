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
          
          // Always start muted to ensure autoplay works
          video.muted = true;
          video.volume = 0;

          // Add event listeners for tracking playback state
          const playHandler = async () => {
            console.log('Video started playing:', channel.name);
            // Try to unmute after playback starts
            try {
              video.muted = false;
              video.volume = 1;
              console.log('Successfully unmuted video');
            } catch (error) {
              console.log('Could not unmute video:', error);
            }
          };

          const errorHandler = (error: Event) => {
            console.error('Video playback error:', error);
          };

          video.addEventListener('playing', playHandler);
          video.addEventListener('error', errorHandler);

          try {
            console.log('Attempting to play video');
            await video.play();
          } catch (error) {
            console.error('Initial play attempt failed:', error);
            // Keep trying to play
            const playInterval = setInterval(async () => {
              try {
                await video.play();
                clearInterval(playInterval);
              } catch (err) {
                console.log('Retry play attempt failed:', err);
              }
            }, 1000);
          }

          // Cleanup event listeners
          return () => {
            video.removeEventListener('playing', playHandler);
            video.removeEventListener('error', errorHandler);
          };
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
