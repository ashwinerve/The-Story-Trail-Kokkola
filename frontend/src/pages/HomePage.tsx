import { useState, useEffect, lazy, Suspense } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetUserProgress, useGetAllLocationsWithCoordinates, useInitializeLocations, useVerifyLocationsInitialized } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header';
import StoryView from '../components/StoryView';
import ProgressView from '../components/ProgressView';
import { Progress } from '../components/ui/progress';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { StoryLocation } from '../backend';
import { bigIntReplacer, bigIntReviver } from '../lib/bigint-utils';

// Lazy load heavy components to improve initial load time
const MapView = lazy(() => import('../components/MapView'));
const ScannerView = lazy(() => import('../components/ScannerView'));

type ViewState = 'map' | 'scanner' | 'story' | 'progress';

// Helper function to safely deserialize story data with BigInt restoration
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

// Helper function to safely serialize story data with BigInt conversion
function serializeStoryLocation(story: StoryLocation): string {
  try {
    return JSON.stringify(story, bigIntReplacer);
  } catch (error) {
    console.error('✗ Failed to serialize story location:', error);
    throw error;
  }
}

function getInitialStory(): StoryLocation | null {
  try {
    const cachedStory = localStorage.getItem('currentStory');
    if (cachedStory) {
      return deserializeStoryLocation(cachedStory);
    }
  } catch (e) {
    console.error('✗ Failed to parse cached story:', e);
    localStorage.removeItem('currentStory');
  }
  return null;
}

// Loading fallback component for lazy-loaded views
function ViewLoadingFallback({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userProgress, isLoading: isLoadingProgress, refetch: refetchProgress } = useGetUserProgress();
  const { data: locationsInitialized, isLoading: isCheckingLocations } = useVerifyLocationsInitialized();
  const { mutateAsync: initializeLocations, isPending: isInitializingLocations } = useInitializeLocations();
  const { data: allLocations, refetch: refetchLocations } = useGetAllLocationsWithCoordinates();

  const [view, setView] = useState<ViewState>('map');
  const [currentStory, setCurrentStory] = useState<StoryLocation | null>(getInitialStory);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [showInitError, setShowInitError] = useState(false);

  // Auto-initialize locations on first load if not initialized
  useEffect(() => {
    const initLocs = async () => {
      if (!initializationAttempted && locationsInitialized === false) {
        setInitializationAttempted(true);
        setShowInitError(false);
        
        try {
          console.log('⚙️ Story locations not initialized, attempting to initialize...');
          const result = await initializeLocations();
          
          if (result) {
            console.log('✓ Story locations initialized successfully');
            // Wait a bit and refetch to ensure data is available
            await new Promise(resolve => setTimeout(resolve, 500));
            await refetchLocations();
            queryClient.invalidateQueries({ queryKey: ['locationsInitialized'] });
          } else {
            console.log('ℹ️ Location initialization skipped (not admin or already exists)');
          }
        } catch (error: any) {
          console.error('✗ Error initializing locations:', error);
          setShowInitError(true);
        }
      }
    };
    
    if (locationsInitialized !== undefined) {
      initLocs();
    }
  }, [locationsInitialized, initializationAttempted, initializeLocations, refetchLocations, queryClient]);

  // CRITICAL: Automatically reload saved progress from backend on app restart/session reconnect
  useEffect(() => {
    if (identity && !isLoadingProgress) {
      console.log('🔄 App loaded/session reconnected - fetching progress from backend persistent Map...');
      refetchProgress();
    }
  }, [identity]); // Only run when identity changes (login/logout/reconnect)

  // Refetch progress when returning to map view to ensure it's up to date with backend
  useEffect(() => {
    if (view === 'map' && identity) {
      // Small delay to ensure backend has processed any recent updates
      const timer = setTimeout(() => {
        console.log('🔄 Map view active - syncing progress with backend persistent Map...');
        refetchProgress();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [view, identity, refetchProgress]);

  const handleLogout = async () => {
    localStorage.clear();
    queryClient.clear();
    setView('map');
    setCurrentStory(null);
    await clear();
  };

  const handleStoryScanned = (story: StoryLocation) => {
    setCurrentStory(story);
    setView('story');
    
    // Cache the story with safe serialization
    try {
      const serialized = serializeStoryLocation(story);
      localStorage.setItem('currentStory', serialized);
      localStorage.setItem(`story_${story.id}`, serialized);
      console.log('✓ Story cached for offline use');
    } catch (storageError) {
      console.error('⚠️ Failed to cache story:', storageError);
    }
    
    // Refetch progress after a short delay to ensure backend has updated
    setTimeout(() => {
      console.log('🔄 Refetching progress after story scan to sync with backend...');
      refetchProgress();
    }, 200);
  };

  const handleBackToMap = () => {
    setView('map');
    setCurrentStory(null);
    localStorage.removeItem('currentStory');
    
    // Refetch progress when returning to map to ensure consistency with backend
    setTimeout(() => {
      console.log('🔄 Refetching progress on return to map to sync with backend...');
      refetchProgress();
    }, 100);
  };

  const handleViewProgress = () => {
    setView('progress');
  };

  const handleBackFromProgress = () => {
    setView('map');
  };

  const handleOpenScanner = () => {
    setView('scanner');
  };

  const handleLocationSelect = (location: StoryLocation) => {
    setCurrentStory(location);
    setView('story');
  };

  const handleRetryInit = async () => {
    setInitializationAttempted(false);
    setShowInitError(false);
    queryClient.invalidateQueries({ queryKey: ['locationsInitialized'] });
  };

  // Calculate progress with 3 total locations
  const TOTAL_LOCATIONS = 3;
  const completedLocations = userProgress?.completedLocations?.length || 0;
  const progressPercentage = (completedLocations / TOTAL_LOCATIONS) * 100;

  const userName = userProfile?.name || 'Explorer';

  // Check if locations are available
  const hasLocations = allLocations && allLocations.length > 0;
  const isInitializing = isCheckingLocations || isInitializingLocations;
  const showLocationWarning = !isInitializing && !hasLocations && locationsInitialized === false && showInitError;
  const showLocationSuccess = locationsInitialized === true && hasLocations;

  return (
    <div className="min-h-screen bg-background flex flex-col adventure-bg">
      <Header
        userName={userName}
        onLogout={handleLogout}
        onViewProgress={handleViewProgress}
        onOpenScanner={handleOpenScanner}
        currentView={view}
      />

      {view === 'map' && (
        <div className="px-4 pt-3 pb-2 space-y-2">
          {/* Show loading indicator while checking/initializing */}
          {isInitializing && (
            <Alert className="border-2 border-primary/30 bg-primary/5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="text-sm">
                {isCheckingLocations ? 'Verifying story locations...' : 'Initializing story locations...'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Show success message when locations are verified */}
          {showLocationSuccess && !isInitializing && (
            <Alert className="border-2 border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                Story locations ready! {allLocations.length} location{allLocations.length !== 1 ? 's' : ''} available.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Show warning if locations not initialized after attempt */}
          {showLocationWarning && (
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-2">
                <p>Story locations are not yet initialized. Please contact an administrator or try again.</p>
                <Button 
                  onClick={handleRetryInit} 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Retry Initialization
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Progress Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-md">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: '#FFFFFF' }}>
                    {isLoadingProgress ? 'Loading progress...' : 'Story Progress'}
                  </span>
                  <span style={{ color: '#FFFFFF' }}>
                    {completedLocations} of {TOTAL_LOCATIONS} locations discovered
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-center" style={{ color: '#FFFFFF' }}>
                  {progressPercentage === 100 
                    ? '🎉 All locations discovered!' 
                    : `${Math.round(progressPercentage)}% complete`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'map' && (
          <Suspense fallback={<ViewLoadingFallback message="Loading map..." />}>
            <MapView onLocationSelect={handleLocationSelect} />
          </Suspense>
        )}
        {view === 'scanner' && (
          <Suspense fallback={<ViewLoadingFallback message="Initializing scanner..." />}>
            <ScannerView
              onStoryScanned={handleStoryScanned}
              userProgress={userProgress}
              onBackToMap={handleBackToMap}
            />
          </Suspense>
        )}
        {view === 'story' && currentStory && (
          <StoryView story={currentStory} onBack={handleBackToMap} />
        )}
        {view === 'progress' && (
          <ProgressView userProgress={userProgress} onBack={handleBackFromProgress} />
        )}
      </main>
    </div>
  );
}

