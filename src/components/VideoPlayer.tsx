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
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    const initPlayer = async () => {
      try {
        // Cleanup previous instance first
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }

        if (playerRef.current) {
          await playerRef.current.destroy();
          playerRef.current = null;
        }

        // Reset video element completely
        video.removeAttribute('src');
        video.load();
        video.muted = true;
        video.volume = 0;

        console.log('Initializing player for channel:', channel.name);
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          console.error('Browser not supported!');
          return;
        }

        // Create new player instance
        const player = new shaka.Player();
        await player.attach(video);
        playerRef.current = player;

        // Configure DRM if needed
        if (channel.clearKey) {
          console.log('Configuring DRM for channel:', channel.name);
          player.configure({
            drm: {
              clearKeys: channel.clearKey,
              retryParameters: {
                maxAttempts: 5,  // Increased retry attempts
                baseDelay: 1000,
                backoffFactor: 2
              }
            },
            streaming: {
              bufferingGoal: 30,  // Increase buffer size
              rebufferingGoal: 15,
              bufferBehind: 30
            }
          });
        }

        if (channel.type === 'youtube') return;

        if (channel.manifestUri) {
          console.log('Loading manifest for channel:', channel.name);
          await player.load(channel.manifestUri);

          let playAttempts = 0;
          const maxPlayAttempts = 5;
          
          const playHandler = async () => {
            console.log('Video started playing:', channel.name);
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              video.muted = false;
              video.volume = 1;
              console.log('Successfully unmuted video');
            } catch (error) {
              console.log('Could not unmute video:', error);
            }
          };

          const errorHandler = (error: Event) => {
            console.error('Video playback error:', error);
            retryPlay();
          };

          const retryPlay = async () => {
            if (playAttempts < maxPlayAttempts) {
              playAttempts++;
              console.log(`Retry attempt ${playAttempts}/${maxPlayAttempts}`);
              try {
                video.muted = true;
                await video.play();
              } catch (err) {
                console.log('Retry play attempt failed:', err);
                setTimeout(retryPlay, 2000); // Wait longer between retries
              }
            }
          };

          video.addEventListener('playing', playHandler);
          video.addEventListener('error', errorHandler);
          video.addEventListener('pause', retryPlay);

          // Initial play attempt
          try {
            console.log('Attempting to play video');
            await video.play();
          } catch (error) {
            console.error('Initial play attempt failed:', error);
            retryPlay();
          }

          // Store cleanup function
          cleanupRef.current = () => {
            video.removeEventListener('playing', playHandler);
            video.removeEventListener('error', errorHandler);
            video.removeEventListener('pause', retryPlay);
            video.pause();
            video.removeAttribute('src');
            video.load();
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
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
          if (playerRef.current) {
            await playerRef.current.destroy();
            playerRef.current = null;
          }
          video.removeAttribute('src');
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
