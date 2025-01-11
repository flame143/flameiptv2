import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import shaka from 'shaka-player';
import type { Channel } from './Sidebar';

interface VideoPlayerProps {
  channel: Channel;
}

// You can use any of these CORS proxies:
const CORS_PROXIES = [
  'https://cors.zimjs.com/',  // Free CORS proxy
  'https://corsproxy.io/?',   // Alternative proxy
  'https://api.allorigins.win/raw?url=' // Another option
];

const VideoPlayer = ({ channel }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to try different proxies
  const getProxiedUrl = (url: string) => {
    // For testing, using the first proxy. In production, you might want to try others if one fails
    return `${CORS_PROXIES[0]}${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

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

    const initializeNewPlayer = async () => {
      if (!isMounted || !videoRef.current) return;

      try {
        await destroyExisting();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!isMounted) return;

        const video = videoRef.current;
        video.muted = true;
        video.volume = 0;
        
        shaka.polyfill.installAll();
        
        if (!shaka.Player.isBrowserSupported()) {
          throw new Error('Browser not supported');
        }

        const player = new shaka.Player();
        
        // Configure with proxy support
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
          manifest: {
            retryParameters: {
              maxAttempts: 5,
              baseDelay: 1000,
              backoffFactor: 2,
              timeout: 30000
            }
          }
        });

        // Add network request filter for proxying
        player.getNetworkingEngine()?.registerRequestFilter((type, request) => {
          // Only proxy manifest and segment requests
          if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
              type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
            const originalUri = request.uris[0];
            request.uris = [getProxiedUrl(originalUri)];
          }
        });

        await player.attach(video);
        
        if (!isMounted) {
          await player.destroy();
          return;
        }

        playerRef.current = player;

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
          // Use proxied URL for initial manifest load
          const proxiedManifestUri = getProxiedUrl(channel.manifestUri);
          await player.load(proxiedManifestUri);
          
          if (!isMounted) {
            await player.destroy();
            return;
          }

          const onError = (error: Event) => {
            console.error('Playback error:', error);
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

          try {
            await video.play();
            setIsLoading(false);
          } catch (err) {
            console.error('Play failed:', err);
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

    initializeNewPlayer();

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
