import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import type { StoryLocation } from '../backend';

interface StoryViewProps {
  story: StoryLocation;
  onBack: () => void;
}

export default function StoryView({ story, onBack }: StoryViewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (story.audioUrl && audioRef.current) {
      audioRef.current.load();
      // Initialize audio element volume
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [story.audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    // Immediately update audio element volume
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    // If user is adjusting volume and it's not zero, unmute
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Immediately update audio element muted state
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content - Compact layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-3 space-y-3 max-w-2xl pb-2">
          <Card className="overflow-hidden shadow-2xl border-2 border-primary/20">
            {/* Story Header - Compact */}
            <div 
              className="p-5 relative overflow-hidden"
              style={{
                backgroundImage: 'url(/assets/generated/story-panel-bg.dim_800x600.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-adventure opacity-90" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs shadow-md">
                    Location {Number(story.sequenceNumber)}
                  </Badge>
                  <img src="/assets/generated/location-marker.dim_32x32.png" alt="Location" className="h-8 w-8 drop-shadow-lg" />
                </div>
                <CardTitle className="text-2xl mb-2 text-white drop-shadow-lg">{story.title}</CardTitle>
                <CardDescription className="text-base">
                  {story.nextLocationHint && (
                    <span className="text-white/95 drop-shadow">
                      <strong>Next:</strong> {story.nextLocationHint}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            <CardContent className="pt-4 space-y-4 px-4 pb-4">
              {/* Story Content - Compact */}
              <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 p-4 rounded-lg">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">{story.content}</p>
              </div>

              {/* Audio Player - Compact */}
              {story.audioUrl && (
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-lg">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Volume2 className="h-5 w-5" />
                      Audio Narration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-3">
                    <audio
                      ref={audioRef}
                      src={story.audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                    />

                    {/* Play/Pause Button - Compact */}
                    <div className="flex items-center justify-center py-1">
                      <Button
                        onClick={togglePlayPause}
                        size="lg"
                        className="h-20 w-20 rounded-full shadow-xl relative overflow-hidden p-0 bg-primary hover:bg-primary/90"
                        variant="default"
                      >
                        <img 
                          src={isPlaying ? "/assets/generated/pause-button.dim_48x48.png" : "/assets/generated/play-button.dim_48x48.png"}
                          alt={isPlaying ? "Pause" : "Play"}
                          className="h-12 w-12"
                        />
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Slider
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="flex-1 h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Back Button - Fixed at bottom for thumb access with darker feedback */}
      <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur-sm border-t">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          size="lg"
          className="w-full h-14 flex items-center justify-center gap-2 active:bg-muted/80 transition-colors"
        >
          <img 
            src="/assets/generated/back-arrow-transparent.dim_32x32.png" 
            alt="Back" 
            className="h-6 w-6"
          />
          <span className="text-base font-medium">Back to Map</span>
        </Button>
      </div>
    </div>
  );
}
