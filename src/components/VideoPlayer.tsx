import { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';

import type { Channel } from './Sidebar';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize, 
  Minimize, 
  PictureInPicture,
  Loader2,
  Check,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


interface VideoPlayerProps {
  channel: Channel;
}

const VideoPlayer = ({ channel }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullScren, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<shaka.extern.Track[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number | 'auto'>('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPiP, setIsPiP] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  const changeQuality = (trackId: number | 'auto') => {
    if (!playerRef.current) return;
    
    if (trackId === 'auto') {
      playerRef.current.configure({ abr: { enabled: true } });
      setCurrentQuality('auto');
    } else {
      const track = qualities.find(t => t.id === trackId);
      if (track) {
        playerRef.current.configure({ abr: { enabled: false } });
        playerRef.current.selectVariantTrack(track, true);
        setCurrentQuality(trackId);
      }
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
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
        
        // Register request filter for proxy and headers
        player.getNetworkingEngine().registerRequestFilter((type, request) => {
          // Add custom headers if available
          if (channel.userAgent) {
            request.headers['X-User-Agent'] = channel.userAgent;
          }
          if (channel.referrer) {
            request.headers['X-Referer'] = channel.referrer;
          }

          // Apply proxy to all requests
          if (channel.proxyUrl) {
            let uri = request.uris[0];
            
            // 1. Prevent Double Proxying
            if (uri.includes('?url=') || uri.includes('&url=') || (uri.includes('workers.dev') && !channel.proxyUrl.includes('workers.dev'))) {
              return;
            }

            const proxyBase = channel.proxyUrl.split('?')[0].split('{url}')[0];

            // 2. Fix Broken Relative URLs resolved against Proxy Root
            if (uri.startsWith(proxyBase) && uri !== proxyBase && !uri.includes('url=')) {
              const pathAfterProxy = uri.substring(proxyBase.length);
              if (channel.manifestUri) {
                const manifestBase = channel.manifestUri.substring(0, channel.manifestUri.lastIndexOf('/') + 1);
                uri = manifestBase + (pathAfterProxy.startsWith('/') ? pathAfterProxy.substring(1) : pathAfterProxy);
              }
            }

            // 3. Apply Proxy correctly
            if (!uri.startsWith(proxyBase) || (uri.startsWith(proxyBase) && !uri.includes('url='))) {
              const proxyUrl = channel.proxyUrl.includes('{url}')
                ? channel.proxyUrl.replace('{url}', encodeURIComponent(uri))
                : channel.proxyUrl + encodeURIComponent(uri);
              request.uris = [proxyUrl];
            }
          }
        });

        // Configure player for FAST PLAYBACK
        player.configure({
          streaming: {
            bufferingGoal: 5,            // Aggressive: Start after 5s of buffer (was 30)
            rebufferingGoal: 2,          // Aggressive: Rebuffer for 2s (was 15)
            bufferBehind: 10,
            retryParameters: {
              maxAttempts: 3,            // Fewer attempts, fail faster to trigger recovery
              baseDelay: 500,
              backoffFactor: 2,
              timeout: 10000             // Faster timeout
            },
            lowLatencyMode: true,        // Enable LL mode
            jumpLargeGaps: true,         // Avoid getting stuck in gap
            inaccurateManifestTolerance: 2
          },
          manifest: {
            retryParameters: {
              maxAttempts: 3,
              baseDelay: 500,
              timeout: 10000
            }
          },
          abr: {
            enabled: true,
            defaultBandwidthEstimate: 500000, // Start with lower estimate for faster initial load
            switchInterval: 1
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
            // Load manifest
            await player.load(channel.manifestUri);
            
            if (!isMounted) {
              await player.destroy();
              return;
            }

            // Fetch available tracks
            const tracks = player.getVariantTracks();
            // Sort tracks by resolution (height) descending
            const sortedTracks = tracks.sort((a, b) => (b.height || 0) - (a.height || 0));
            setQualities(sortedTracks);

            // Setup event listeners
            const onPlayerError = (error: any) => {
            console.error('Shaka player error details:', {
              category: error.category,
              code: error.code,
              severity: error.severity,
              message: error.message,
              data: error.data
            });
            // Only attempt recovery for critical errors and with a delay to avoid loops
            if (isMounted && playerRef.current === player && error.severity === 2) { // 2 = CRITICAL
              console.warn('Critical error detected, retrying in 5 seconds...');
              setTimeout(() => {
                if (isMounted && playerRef.current === player) {
                  initializeNewPlayer();
                }
              }, 5000);
            }
          };

          const onPlaying = async () => {
            console.log('Video playing event triggered');
            setIsLoading(false);
            setIsPlaying(true);
            if (isMounted && video.muted) {
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                video.muted = false;
                video.volume = 1;
                setIsMuted(false);
                setVolume(1);
              } catch (err) {
                console.error('Error unmuting:', err);
              }
            }
          };

          const onPause = () => setIsPlaying(false);


          const onCanPlay = () => {
            console.log('Video canplay event triggered');
            setIsLoading(false);
          };

          player.addEventListener('error', onPlayerError);
          video.addEventListener('playing', onPlaying);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('pause', onPause);

          // Attempt playback
          try {
            console.log('Attempting to play:', channel.name);
            if (channel.clearKey) {
              console.log('DRM Keys configured for:', channel.name, channel.clearKey);
            }
            await video.play();
            setIsPlaying(true);
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              console.warn('Play request was aborted (expected during rapid switching or reload)');
            } else {
              console.error('Play failed:', err);
              setIsLoading(false); // Clear loading even on error
            }
          }

          return () => {
            player.removeEventListener('error', onPlayerError);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('pause', onPause);
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
          style={{ position: 'relative' }}
        />
        <style>{`
          [class*="lovable"],
          [class*="Lovable"],
          [id*="lovable"],
          [id*="Lovable"],
          [data-lovable],
          .lovable-button,
          .lovable-editor {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
            clip: rect(0 0 0 0) !important;
            margin: -1px !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: hidden !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black flex items-center justify-center relative group cursor-default overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        autoPlay
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div className={cn(
        "absolute inset-0 flex flex-col justify-end transition-opacity duration-300 z-40 bg-gradient-to-t from-black/80 via-transparent to-transparent",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        
        {/* Bottom Control Bar */}
        <div className="p-4 flex items-center gap-4">
          
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2 group/volume">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </Button>
            <div className="w-0 group-hover/volume:w-24 transition-all duration-300 overflow-hidden">
               <Slider
                 value={[isMuted ? 0 : volume]}
                 max={1}
                 step={0.01}
                 onValueChange={handleVolumeChange}
                 className="w-24"
               />
            </div>
          </div>

          <div className="flex-1" />

          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0a] border-white/10 text-white">


              
              {/* Resolution Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center justify-between hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Resolution</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {currentQuality === 'auto' ? 'Auto' : `${qualities.find(q => q.id === currentQuality)?.height}p`}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#0a0a0a] border-white/10 text-white min-w-[150px]">


                  <DropdownMenuItem 
                    className="flex items-center justify-between hover:bg-white/10 cursor-pointer"
                    onClick={() => changeQuality('auto')}
                  >
                    <span>Auto</span>
                    {currentQuality === 'auto' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  {qualities.map((track) => (
                    <DropdownMenuItem 
                      key={track.id}
                      className="flex items-center justify-between hover:bg-white/10 cursor-pointer"
                      onClick={() => changeQuality(track.id)}
                    >
                      <span>{track.height}p {track.frameRate ? `(${Math.round(track.frameRate)}fps)` : ''}</span>
                      {currentQuality === track.id && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Playback Speed Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center justify-between hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                    <span>Playback speed</span>
                  </div>
                  <span className="text-xs text-zinc-500">{playbackSpeed}x</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#0a0a0a] border-white/10 text-white">


                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <DropdownMenuItem 
                      key={speed}
                      className="flex items-center justify-between hover:bg-white/10 cursor-pointer"
                      onClick={() => changePlaybackSpeed(speed)}
                    >
                      <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                      {playbackSpeed === speed && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* PiP Toggle */}
              <DropdownMenuItem 
                className="flex items-center justify-between hover:bg-white/10 cursor-pointer"
                onClick={togglePiP}
              >
                <div className="flex items-center gap-2">
                  <PictureInPicture className="w-4 h-4" />
                  <span>Picture-in-picture</span>
                </div>
                <span className="text-xs text-zinc-500">{isPiP ? 'On' : 'Off'}</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleFullScreen}
          >
            {isFullScren ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </Button>

        </div>
      </div>

      <style>{`
          .group:hover .group-hover\\:opacity-100 {
            opacity: 1;
          }
          [class*="lovable"], [class*="Lovable"], [id*="lovable"], [id*="Lovable"], [data-lovable], .lovable-button, .lovable-editor {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
            clip: rect(0 0 0 0) !important;
            margin: -1px !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: hidden !important;
          }
      `}</style>
    </div>
  );

};

export default VideoPlayer;