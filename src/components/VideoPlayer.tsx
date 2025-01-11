import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import shaka from 'shaka-player';
import type { Channel } from './Sidebar';

interface VideoPlayerProps {
  channel: Channel;
}

const VideoPlayer = ({ channel }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getProxiedUrl = (url: string) => {
    // Check if the URL is from problematic domains
    if (url.includes('astro.com.my')) {
      // Use a CORS proxy
      return `https://cors-anywhere.herokuapp.com/${url}`;
    }
    return url;
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Force destroy any existing instances
    const destroyExisting = async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.destroy();
          playerRef.current = null;
        } catch (err) {
          console.error('Error destroying player:', err);
        }
      }

      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch (err) {
          console.error('Error resetting video:', err);
        }
      }
    };

    // Wait a bit before initializing new player
    const initializeNewPlayer = async () => {
      if (!isMounted || !videoRef.current) return;

      try {
        await destroyExisting();
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!isMounted) return;

        const video = videoRef.current;
        
        // Reset video state
        video.muted = true;
        video.volume = 0;
        
        // Initialize Shaka
        shaka.polyfill.installAll();
        
        if (!shaka.Player.isBrowserSupported()) {
          throw new Error('Browser not supported');
        }

        // Create new player
        const player = new shaka.Player();
        
        // Configure player before attaching
        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 15,
            bufferBehind: 30,
            retryParameters: {
              maxAttempts: 5,
              baseDelay: 1000,
              backoffFactor: 2,
              timeout: 30000
            }
          },
          abr: {
            enabled: true,
            defaultBandwidthEstimate: 1000000
          }
        });

        // Attach player to video element
        await player.attach(video);
        
        if (!isMounted) {
          await player.destroy();
          return;
        }

        playerRef.current = player;

        // Configure DRM if needed
        if (channel.clearKey) {
          player.configure({
            drm: {
              clearKeys: channel.clearKey,
              retryParameters: {
                maxAttempts: 5,
                baseDelay: 1000,
                backoffFactor: 2
              }
            }
          });
        }

        if (channel.manifestUri) {
          console.log('Loading manifest for channel:', channel.name);
          // Use proxied URL for problematic domains
          const manifestUrl = getProxiedUrl(channel.manifestUri);
          await player.load(manifestUrl);
          
          if (!isMounted) {
            await player.destroy();
            return;
          }

          // Setup event listeners
          const onError = (error: Event) => {
            console.error('Playback error:', error);
            // Attempt recovery
            if (isMounted && playerRef.current === player) {
              initializeNewPlayer();
            }
          };

          const onPlaying = async () => {
            if (isMounted && video.muted) {
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                video.muted = false;
                video.volume = 1;
              } catch (err) {
                console.error('Error unmuting:', err);
              }
            }
          };

          video.addEventListener('error', onError);
          video.addEventListener('playing', onPlaying);

          // Attempt playback
          try {
            await video.play();
            setIsLoading(false);
          } catch (err) {
            console.error('Play failed:', err);
            // Retry once more after a delay
            if (isMounted) {
              setTimeout(async () => {
                if (isMounted && playerRef.current === player) {
                  try {
                    await video.play();
                  } catch (retryErr) {
                    console.error('Retry failed:', retryErr);
                  }
                }
              }, 2000);
            }
          }

          return () => {
            video.removeEventListener('error', onError);
            video.removeEventListener('playing', onPlaying);
          };
        }
      } catch (err) {
        console.error('Player initialization failed:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start initialization process
    initializeNewPlayer();

    // Cleanup
    return () => {
      isMounted = false;
      destroyExisting();
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
      {isLoading && (
        <div className="absolute text-white">Loading...</div>
      )}
    </div>
  );
};

export default VideoPlayer;