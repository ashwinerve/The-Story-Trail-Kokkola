import { useEffect, useRef, useState } from 'react';
import { useQRScanner } from '../qr-code/useQRScanner';
import { useGetStoryLocation, useGetLocation1QuestTask, useGetLocation2Task, useGetAllLocationsWithCoordinates, useInitializeLocations, type QuestTask } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Camera, SwitchCamera, AlertCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import QuestTaskPopup from './QuestTaskPopup';
import type { StoryLocation, UserProgress, PublicLocationInfo } from '../backend';
import { bigIntReplacer, bigIntReviver } from '../lib/bigint-utils';

interface ScannerViewProps {
  onStoryScanned: (story: StoryLocation) => void;
  userProgress: UserProgress | null | undefined;
  onBackToMap: () => void;
}

// QR code identifiers for locations
const LOCATION_1_QR_ID = 'location_1';
const LOCATION_2_QR_ID = 'location_2';

// Fallback story data in case backend is not initialized
const FALLBACK_LOCATION_1: StoryLocation = {
  id: 'location_1',
  title: 'Neristan – The Old Wooden Town',
  content: 'Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?',
  audioUrl: '/assets/ElevenLabs_Text_to_Speech_audio.mp3',
  sequenceNumber: BigInt(1),
  nextLocationHint: 'After you figure out the meaning here, check for the next historic marker nearby.',
  coordinates: {
    latitude: 63.83993,
    longitude: 23.12778,
  },
};

const FALLBACK_LOCATION_2: StoryLocation = {
  id: 'location_2',
  title: 'Halkokari Battle Memorial',
  content: 'This location is dedicated to the battle memorial/park. Please find the year when this clash took place.',
  audioUrl: '/assets/Location_2_audio.mp3',
  sequenceNumber: BigInt(2),
  nextLocationHint: 'Look for the next historic marker nearby.',
  coordinates: {
    latitude: 63.859999,
    longitude: 23.118352,
  },
};

// Helper function to safely serialize story data with BigInt conversion
function serializeStoryLocation(story: StoryLocation): string {
  try {
    return JSON.stringify(story, bigIntReplacer);
  } catch (error) {
    console.error('✗ Failed to serialize story location:', error);
    throw error;
  }
}

// Helper function to deserialize story data and restore BigInt
function deserializeStoryLocation(json: string): StoryLocation {
  try {
    const parsed = JSON.parse(json, bigIntReviver);
    // Ensure sequenceNumber is BigInt
    if (typeof parsed.sequenceNumber === 'string' || typeof parsed.sequenceNumber === 'number') {
      parsed.sequenceNumber = BigInt(parsed.sequenceNumber);
    }
    return parsed;
  } catch (error) {
    console.error('✗ Failed to deserialize story location:', error);
    throw error;
  }
}

export default function ScannerView({ onStoryScanned, userProgress, onBackToMap }: ScannerViewProps) {
  const queryClient = useQueryClient();
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
  });

  const { mutateAsync: getStoryLocation } = useGetStoryLocation();
  const { mutateAsync: getLocation1QuestTask } = useGetLocation1QuestTask();
  const { mutateAsync: getLocation2Task } = useGetLocation2Task();
  const { data: allLocations, refetch: refetchLocations } = useGetAllLocationsWithCoordinates();
  const { mutateAsync: initializeLocations } = useInitializeLocations();
  const [isProcessing, setIsProcessing] = useState(false);
  const [questTask, setQuestTask] = useState<QuestTask | null>(null);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [showQuestPopup, setShowQuestPopup] = useState(false);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const processedQRs = useRef(new Set<string>());
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Calculate next location based on progress
  const nextLocation = allLocations && userProgress && Array.isArray(allLocations)
    ? allLocations.find((loc: PublicLocationInfo) => !userProgress.completedLocations.includes(loc.sequenceNumber))
    : null;

  useEffect(() => {
    if (qrResults.length > 0 && !isProcessing) {
      const latestResult = qrResults[0];
      if (!processedQRs.current.has(latestResult.data)) {
        processedQRs.current.add(latestResult.data);
        handleQRScanned(latestResult.data);
      }
    }
  }, [qrResults, isProcessing]);

  const handleQRScanned = async (qrData: string) => {
    setIsProcessing(true);
    setRetryCount(0);
    
    try {
      // Normalize QR data for comparison
      const normalizedData = qrData.toLowerCase().trim();
      console.log('📷 QR Code scanned:', normalizedData);

      // Check if this is Location 1 QR code
      if (normalizedData === LOCATION_1_QR_ID || normalizedData.includes('location_1') || normalizedData === '1') {
        await handleLocationScan(LOCATION_1_QR_ID, 1);
        return;
      }

      // Check if this is Location 2 QR code
      if (normalizedData === LOCATION_2_QR_ID || normalizedData.includes('location_2') || normalizedData === '2') {
        await handleLocationScan(LOCATION_2_QR_ID, 2);
        return;
      }

      // Check if story is cached offline
      const cachedStory = localStorage.getItem(`story_${qrData}`);
      if (cachedStory) {
        try {
          const story = deserializeStoryLocation(cachedStory);
          toast.success('✓ Story loaded from offline cache');
          onStoryScanned(story);
          return;
        } catch (parseError) {
          console.error('✗ Failed to parse cached story:', parseError);
          localStorage.removeItem(`story_${qrData}`);
        }
      }

      // Fetch from backend with retry logic
      await fetchStoryWithRetry(qrData);
      
    } catch (error: any) {
      console.error('✗ Error processing QR code:', error);
      const errorMsg = error?.message || 'Failed to load story';
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLocationScan = async (locationId: string, locationNum: number) => {
    setCurrentLocationId(locationId);
    
    try {
      // Check if locations are initialized, if not try to initialize
      if (!allLocations || allLocations.length === 0) {
        console.log('⚠️ Locations not initialized, attempting to initialize...');
        await initializeLocations();
        // Wait and refetch locations
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refetchLocations();
      }
      
      // Use fallback data immediately to show popup instantly
      const fallbackStory = locationNum === 1 ? FALLBACK_LOCATION_1 : FALLBACK_LOCATION_2;
      const fallbackTask: QuestTask = {
        message: fallbackStory.content,
        audioFile: locationNum === 1 ? 'ElevenLabs_Text_to_Speech_audio.mp3' : 'Location_2_audio.mp3'
      };
      
      // Set title and task immediately with fallback data for instant display
      setStoryTitle(fallbackStory.title);
      setQuestTask(fallbackTask);
      setShowQuestPopup(true);
      toast.success(`✓ ${fallbackStory.title} discovered!`);
      console.log(`✓ Quest popup displayed with fallback data for Location ${locationNum}`);
      
      // Try to fetch actual data in background to update if different
      try {
        console.log(`📤 Fetching quest task for Location ${locationNum}...`);
        const task = locationNum === 1 
          ? await getLocation1QuestTask()
          : await getLocation2Task();
        
        if (task) {
          console.log('✓ Quest task fetched successfully:', task);
          // Update with actual data if different
          setQuestTask(task);
        }
        
        // Also try to fetch the full story location for the title
        const storyLocation = await getStoryLocation(locationId);
        if (storyLocation) {
          console.log('✓ Story location fetched successfully:', storyLocation);
          setStoryTitle(storyLocation.title);
          
          // Cache the story for offline use
          try {
            localStorage.setItem(`story_${locationId}`, serializeStoryLocation(storyLocation));
          } catch (cacheError) {
            console.error('⚠️ Failed to cache story:', cacheError);
          }
        }
      } catch (fetchError) {
        console.error('⚠️ Failed to fetch quest task or story location, using fallback:', fetchError);
        // Already showing fallback, no need to do anything
      }
      
    } catch (error: any) {
      console.error(`✗ Error handling Location ${locationNum} scan:`, error);
      // Use fallback data even on error
      const fallbackStory = locationNum === 1 ? FALLBACK_LOCATION_1 : FALLBACK_LOCATION_2;
      setStoryTitle(fallbackStory.title);
      setQuestTask({
        message: fallbackStory.content,
        audioFile: locationNum === 1 ? 'ElevenLabs_Text_to_Speech_audio.mp3' : 'Location_2_audio.mp3'
      });
      setShowQuestPopup(true);
      toast.success(`✓ ${fallbackStory.title} discovered!`);
    }
  };

  const fetchStoryWithRetry = async (qrData: string, attempt: number = 1): Promise<void> => {
    const maxAttempts = 3;
    
    try {
      console.log(`📤 Fetching story (attempt ${attempt}/${maxAttempts})...`);
      const story = await getStoryLocation(qrData);
      
      if (story) {
        // Cache the story with safe serialization
        try {
          localStorage.setItem(`story_${qrData}`, serializeStoryLocation(story));
          console.log('✓ Story cached for offline use');
        } catch (storageError) {
          console.error('⚠️ Failed to cache story:', storageError);
        }
        
        onStoryScanned(story);
        toast.success('✓ Story unlocked!');
      } else {
        // Story not found, check if it matches a known location
        const normalizedData = qrData.toLowerCase();
        if (normalizedData.includes('location')) {
          const locationNum = normalizedData.includes('1') ? 1 : normalizedData.includes('2') ? 2 : null;
          
          if (locationNum === 1) {
            try {
              localStorage.setItem(`story_${LOCATION_1_QR_ID}`, serializeStoryLocation(FALLBACK_LOCATION_1));
            } catch (e) {
              console.error('⚠️ Failed to cache fallback location 1:', e);
            }
            onStoryScanned(FALLBACK_LOCATION_1);
            toast.success('✓ Location 1 unlocked!');
            return;
          } else if (locationNum === 2) {
            try {
              localStorage.setItem(`story_${LOCATION_2_QR_ID}`, serializeStoryLocation(FALLBACK_LOCATION_2));
            } catch (e) {
              console.error('⚠️ Failed to cache fallback location 2:', e);
            }
            onStoryScanned(FALLBACK_LOCATION_2);
            toast.success('✓ Location 2 unlocked!');
            return;
          }
        }
        
        // If we've tried multiple times, suggest re-initialization
        if (attempt >= maxAttempts) {
          toast.error(`Story location not found after ${maxAttempts} attempts. Please try scanning again.`);
          
          // Try to re-initialize locations in background
          try {
            await initializeLocations();
            queryClient.invalidateQueries({ queryKey: ['allLocations'] });
          } catch (initError) {
            console.error('✗ Failed to re-initialize locations:', initError);
          }
        } else {
          // Retry after delay
          setRetryCount(attempt);
          const delay = 1000 * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          await fetchStoryWithRetry(qrData, attempt + 1);
        }
      }
    } catch (error: any) {
      console.error(`✗ Story fetch attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        // Retry after delay
        setRetryCount(attempt);
        const delay = 1000 * attempt;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await fetchStoryWithRetry(qrData, attempt + 1);
      } else {
        // Final attempt failed
        const errorMsg = error?.message || 'Failed to load story';
        
        if (errorMsg.includes('not initialized') || errorMsg.includes('not found')) {
          console.log('⚠️ Attempting to re-initialize locations...');
          try {
            await initializeLocations();
            queryClient.invalidateQueries({ queryKey: ['allLocations'] });
            toast.info('Please scan the QR code again.');
          } catch (initError) {
            toast.error('Story locations are not yet initialized. Please try again later.');
          }
        } else {
          toast.error(`${errorMsg} (after ${maxAttempts} attempts)`);
        }
      }
    }
  };

  const handleStartScanning = async () => {
    const success = await startScanning();
    if (!success) {
      toast.error('Failed to start camera. Please check permissions.');
    }
  };

  const handleCloseQuestPopup = () => {
    setShowQuestPopup(false);
    setQuestTask(null);
    setStoryTitle('');
    setCurrentLocationId(null);
    
    // Refetch progress after closing popup to ensure UI is updated with backend state
    console.log('🔄 Refetching progress after quest completion...');
    queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    queryClient.refetchQueries({ queryKey: ['userProgress'] });
  };

  if (isSupported === false) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera is not supported on this device or browser. Please use a device with camera support.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur-sm border-t">
          <Button 
            onClick={onBackToMap} 
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

  return (
    <div className="flex flex-col h-full">
      {/* Quest Task Popup with locationId and storyTitle for reliable display and progress saving */}
      <QuestTaskPopup 
        questTask={questTask}
        storyTitle={storyTitle}
        isOpen={showQuestPopup}
        onClose={handleCloseQuestPopup}
        locationId={currentLocationId || undefined}
      />

      {/* Main Content - Compact layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-3 space-y-3 max-w-2xl pb-2">
          {/* Next Location Hint */}
          {nextLocation && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-lg">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Navigation className="h-5 w-5 text-primary" />
                  Next Location
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>{nextLocation.title}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Location {Number(nextLocation.sequenceNumber)} of the trail
                </p>
              </CardContent>
            </Card>
          )}

          {/* Scanner Card - Compact */}
          <Card className="shadow-xl border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-2 pt-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <img src="/assets/generated/scanner-icon-transparent.dim_64x64.png" alt="Scanner" className="h-7 w-7" />
                QR Code Scanner
              </CardTitle>
              <CardDescription className="text-xs">
                Point your camera at a QR code to unlock the story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 px-4 pb-4">
              {/* Camera Preview - Compact aspect */}
              <div className="relative w-full bg-muted rounded-lg overflow-hidden border-4 border-primary/30 shadow-inner" style={{ aspectRatio: '4 / 3' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Overlay */}
                {isActive && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-4 border-primary/30 rounded-lg" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-primary rounded-lg animate-pulse shadow-lg" />
                  </div>
                )}

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                      <p className="text-sm text-foreground font-medium">
                        {retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Processing QR code...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error.message}</AlertDescription>
                </Alert>
              )}

              {/* Controls - Touch-friendly */}
              <div className="flex gap-2">
                {!isActive ? (
                  <Button
                    onClick={handleStartScanning}
                    disabled={!canStartScanning}
                    className="flex-1 shadow-md h-12 text-base font-semibold"
                    size="lg"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Start Scanner
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopScanning} variant="outline" className="flex-1 h-12 text-base" size="lg">
                      Stop Scanner
                    </Button>
                    {isMobile && (
                      <Button onClick={() => switchCamera()} variant="outline" size="lg" className="h-12 px-4">
                        <SwitchCamera className="h-5 w-5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur-sm border-t">
        <Button 
          onClick={onBackToMap} 
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

