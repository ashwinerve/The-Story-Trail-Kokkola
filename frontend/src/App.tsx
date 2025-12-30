import { ThemeProvider } from 'next-themes';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Lazy load HomePage to defer loading of heavy components (Map, QR Scanner)
const HomePage = lazy(() => import('./pages/HomePage'));

const PROFILE_LOAD_TIMEOUT = 6000; // 6 seconds timeout
const MAX_RETRIES = 3;

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched,
    error: profileError,
    refetch: refetchProfile,
    isError: profileIsError
  } = useGetCallerUserProfile();
  
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showTimeoutError, setShowTimeoutError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [useGuestMode, setUseGuestMode] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const isAuthenticated = !!identity;

  // Reset states when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      setShowProfileSetup(false);
      setShowTimeoutError(false);
      setRetrying(false);
      setRetryCount(0);
      setUseGuestMode(false);
      setTimeoutReached(false);
    }
  }, [isAuthenticated]);

  // Determine if we should show profile setup
  useEffect(() => {
    if (!isAuthenticated || useGuestMode) {
      setShowProfileSetup(false);
      return;
    }

    if (profileFetched && userProfile === null) {
      setShowProfileSetup(true);
      setShowTimeoutError(false);
    } else if (userProfile !== null) {
      setShowProfileSetup(false);
      setShowTimeoutError(false);
    }
  }, [isAuthenticated, profileFetched, userProfile, useGuestMode]);

  // Timeout mechanism with automatic fallback
  useEffect(() => {
    if (!isAuthenticated || useGuestMode || profileFetched || showTimeoutError) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!profileFetched) {
        console.warn('Profile loading timeout reached');
        setTimeoutReached(true);
        
        // First timeout: auto-retry once
        if (retryCount === 0) {
          console.log('Attempting automatic retry...');
          setRetryCount(1);
          refetchProfile().catch(err => {
            console.error('Auto-retry failed:', err);
            setShowTimeoutError(true);
          });
        } else {
          // Subsequent timeouts: show error screen
          setShowTimeoutError(true);
        }
      }
    }, PROFILE_LOAD_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, profileFetched, retryCount, refetchProfile, useGuestMode, showTimeoutError]);

  // Handle errors from React Query
  useEffect(() => {
    if (profileIsError && profileError && !showTimeoutError) {
      console.error('Profile query error:', profileError);
      setShowTimeoutError(true);
    }
  }, [profileIsError, profileError, showTimeoutError]);

  // Handle manual retry
  const handleRetry = async () => {
    setRetrying(true);
    setShowTimeoutError(false);
    setTimeoutReached(false);
    
    try {
      setRetryCount(prev => prev + 1);
      await refetchProfile();
      
      // Wait a moment to see if fetch succeeds
      setTimeout(() => {
        setRetrying(false);
      }, 500);
    } catch (error) {
      console.error('Manual retry failed:', error);
      setRetrying(false);
      setShowTimeoutError(true);
    }
  };

  // Handle guest mode fallback
  const handleGuestMode = () => {
    console.log('Entering guest mode - bypassing profile requirement');
    setUseGuestMode(true);
    setShowTimeoutError(false);
    setShowProfileSetup(false);
    setTimeoutReached(false);
  };

  // Show loading state while initializing identity
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background flex items-center justify-center adventure-bg">
          <div className="text-center space-y-4 p-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <p className="text-lg font-medium text-foreground">Initializing...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show timeout/error screen with retry and guest mode options
  if (showTimeoutError && !useGuestMode) {
    const canRetry = retryCount < MAX_RETRIES;
    
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background flex items-center justify-center adventure-bg p-6">
          <div className="text-center space-y-6 max-w-md bg-card p-8 rounded-lg shadow-xl border-2 border-destructive/20">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Connection Issue</h2>
              <p className="text-sm text-muted-foreground">
                {profileError 
                  ? 'Unable to connect to the backend. Please check your internet connection.'
                  : 'Profile loading is taking longer than expected. The backend may be slow or unavailable.'}
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Attempt {retryCount} of {MAX_RETRIES}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {canRetry && (
                <Button 
                  onClick={handleRetry} 
                  disabled={retrying}
                  size="lg"
                  className="w-full"
                >
                  {retrying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Retry Connection
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={handleGuestMode} 
                variant="outline"
                size="lg"
                className="w-full"
              >
                Continue Without Profile
              </Button>
            </div>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Loading profile - show spinner with timeout awareness
  if ((profileLoading || !profileFetched) && !showTimeoutError && !useGuestMode && !retrying) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background flex items-center justify-center adventure-bg">
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">Loading Profile...</p>
              <p className="text-sm text-muted-foreground">
                {retryCount > 0 
                  ? `Retry attempt ${retryCount}...` 
                  : 'Fetching your adventure profile'}
              </p>
            </div>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated but no profile - show profile setup
  if (showProfileSetup && !useGuestMode) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ProfileSetupPage onComplete={() => setShowProfileSetup(false)} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated with profile or guest mode - show main game with lazy loading
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center adventure-bg">
            <div className="text-center space-y-4 p-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">Loading Adventure...</p>
                <p className="text-sm text-muted-foreground">
                  Preparing your story trail experience
                </p>
              </div>
            </div>
          </div>
        }
      >
        <HomePage />
      </Suspense>
      <Toaster />
    </ThemeProvider>
  );
}
