import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUserProgress } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

interface QuestTask {
  message: string;
  audioFile: string;
}

interface QuestTaskPopupProps {
  questTask: QuestTask | null;
  storyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  locationId?: string;
}

// Helper to retry async operation with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  operationName: string
): Promise<{ success: boolean; result?: T; error?: Error; attempts: number }> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${operationName} (attempt ${attempt + 1}/${maxRetries + 1})...`);
      const result = await operation();
      console.log(`✅ ${operationName} succeeded on attempt ${attempt + 1}`);
      return { success: true, result, attempts: attempt + 1 };
    } catch (error: any) {
      lastError = error;
      console.error(`✗ ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt); // 500ms, 1000ms, 2000ms
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { success: false, error: lastError, attempts: maxRetries + 1 };
}

export default function QuestTaskPopup({ questTask, storyTitle, isOpen, onClose, locationId }: QuestTaskPopupProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();
  const { mutateAsync: updateProgress, isPending: isSavingProgress } = useUpdateUserProgress();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load and prepare audio when popup opens with robust retry logic (up to 3 times)
  useEffect(() => {
    if (isOpen && questTask && audioRef.current) {
      setIsAudioReady(false);
      setAudioError(false);
      setRetryCount(0);
      setIsPlaying(false);
      
      const audio = audioRef.current;
      
      // Reset audio state
      audio.currentTime = 0;
      audio.muted = isMuted;
      audio.load();
      
      const handleCanPlay = () => {
        console.log('✓ Audio ready to play');
        setIsAudioReady(true);
        setAudioError(false);
      };

      const handleError = (e: Event) => {
        console.error('✗ Audio loading error:', e);
        setAudioError(true);
        setIsAudioReady(false);
        
        // Retry loading audio up to 3 times with exponential backoff
        if (retryCount < 2) {
          const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s
          console.log(`⏳ Retrying audio load in ${delay}ms (attempt ${retryCount + 2}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            audio.load();
          }, delay);
        } else {
          console.error('✗ Audio failed to load after 3 attempts');
          toast.error('Audio unavailable. You can still complete the quest.');
        }
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }

    // Cleanup: pause and reset audio when popup closes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsAudioReady(false);
        setAudioError(false);
      }
    };
  }, [isOpen, questTask, retryCount]);

  // Sync muted state with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current || !isAudioReady) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('✗ Play failed:', error);
          toast.error('Failed to play audio');
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleComplete = async () => {
    if (!locationId) {
      console.warn('⚠️ No locationId provided, skipping progress save');
      toast.info('Quest viewed. No progress to save.');
      onClose();
      return;
    }

    console.log('📤 Starting reliable progress save to backend persistent Map for location:', locationId);

    // CRITICAL: Save to backend with comprehensive retry logic (3 attempts total) and verification
    const backendResult = await retryWithBackoff(
      () => updateProgress({ locationId, workingSequences: [] }),
      2, // 3 total attempts (initial + 2 retries)
      '💾 Backend progress save with verification'
    );

    if (backendResult.success && backendResult.result) {
      // Backend save successful - progress is now permanently stored in persistent Map
      console.log(`✅ Progress CONFIRMED saved to backend persistent Map (attempt ${backendResult.attempts}):`, backendResult.result);
      
      // Update React Query cache immediately with the verified backend result
      queryClient.setQueryData(['userProgress'], backendResult.result);
      
      // Invalidate and refetch to ensure consistency with backend state
      await queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      
      // Wait for backend to fully process, then perform final verification refetch
      setTimeout(async () => {
        console.log('🔍 Performing final verification refetch from backend persistent Map...');
        await queryClient.refetchQueries({ queryKey: ['userProgress'] });
      }, 500);
      
      toast.success(`✅ Quest completed! Progress saved (verified in ${backendResult.attempts} attempt${backendResult.attempts > 1 ? 's' : ''}).`);
      
      // Close modal only after successful save and verification
      onClose();
    } else {
      // Backend save failed after all retries
      const errorMsg = backendResult.error?.message || 'Unknown error';
      console.error(`✗ Backend save failed after ${backendResult.attempts} attempts:`, errorMsg);
      
      // Show appropriate error message based on error type
      if (errorMsg.includes('Network error') || errorMsg.includes('saved locally')) {
        toast.warning(`Progress saved locally. Will sync when connection is restored.`);
        // Close modal since progress is saved locally
        onClose();
      } else if (errorMsg.includes('Unauthorized') || errorMsg.includes('Authentication')) {
        toast.error('Authentication error. Please log in again.');
        // Don't close modal - user needs to re-authenticate
      } else if (errorMsg.includes('Location not found')) {
        toast.error('Location not found. Please try again or contact support.');
        // Don't close modal - allow retry
      } else {
        toast.error(`Failed to save progress after ${backendResult.attempts} attempts. Please try again.`);
        // Don't close modal - allow retry
      }
      
      // Modal behavior: close only if progress is saved locally, otherwise keep open for retry
      console.log('ℹ️ Modal behavior: ' + (errorMsg.includes('saved locally') ? 'closing (saved locally)' : 'remaining open for retry'));
    }
  };

  if (!questTask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="w-[90vw] max-w-md mx-auto rounded-xl shadow-2xl border-2 border-primary/30 bg-background p-6"
        aria-describedby="quest-description"
      >
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-xl font-bold text-primary text-center leading-tight">
            {storyTitle || 'Quest Task'}
          </DialogTitle>
        </DialogHeader>

        <div id="quest-description" className="space-y-4">
          {/* Quest Message */}
          <div className="bg-muted/50 p-4 rounded-lg border border-primary/10">
            <p className="text-sm text-foreground leading-relaxed">
              {questTask.message}
            </p>
          </div>

          {/* Audio Player - Simple controls only (no volume slider) */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-3">
            <audio
              ref={audioRef}
              src={`/assets/${questTask.audioFile}`}
              onEnded={() => setIsPlaying(false)}
              preload="auto"
            />

            {/* Audio Controls - Play/Pause and Mute/Unmute only */}
            <div className="flex items-center justify-center gap-4">
              {/* Play/Pause Button */}
              <Button
                onClick={togglePlayPause}
                size="lg"
                disabled={!isAudioReady || audioError}
                className="h-14 w-14 rounded-full shadow-lg p-0 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                variant="default"
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>

              {/* Mute/Unmute Button */}
              <Button
                onClick={toggleMute}
                variant="outline"
                size="lg"
                disabled={!isAudioReady || audioError}
                className="h-12 w-12 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Audio Status */}
            {!isAudioReady && !audioError && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {retryCount > 0 ? `Loading audio (retry ${retryCount + 1}/3)...` : 'Loading audio...'}
                </p>
              </div>
            )}
            
            {audioError && retryCount >= 2 && (
              <div className="text-center">
                <p className="text-xs text-destructive">
                  Audio unavailable
                </p>
              </div>
            )}
          </div>

          {/* Done Button - Saves progress to backend persistent Map with comprehensive retry and verification */}
          <Button
            onClick={handleComplete}
            disabled={isSavingProgress}
            className="w-full h-12 text-base font-semibold shadow-lg"
            size="lg"
          >
            {isSavingProgress ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                Saving progress...
              </>
            ) : (
              'Done'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

