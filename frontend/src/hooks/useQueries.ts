import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, StoryLocation, UserProgress, PublicLocationInfo } from '../backend';
import { bigIntReplacer, bigIntReviver } from '../lib/bigint-utils';

// Local type definition for QuestTask (not in backend)
export interface QuestTask {
  message: string;
  audioFile: string;
}

// Optimized retry configuration
const RETRY_CONFIG = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 2000), // 500ms, 1000ms, 2000ms
};

// Helper to save progress to localStorage as backup cache with proper BigInt serialization
function saveProgressToLocalStorage(progress: UserProgress): boolean {
  try {
    const progressData = {
      lastCompletedLocation: progress.lastCompletedLocation.toString(),
      totalLocations: progress.totalLocations.toString(),
      completedLocations: progress.completedLocations.map(n => n.toString()),
      mainProgress: progress.mainProgress,
      currentSequences: progress.currentSequences.map(n => n.toString()),
      timestamp: Date.now(),
      synced: true,
    };
    localStorage.setItem('userProgress', JSON.stringify(progressData));
    console.log('💾 Progress cached to localStorage (backup only):', progressData);
    return true;
  } catch (error) {
    console.error('✗ Failed to save progress to localStorage:', error);
    return false;
  }
}

// Helper to load progress from localStorage with proper BigInt deserialization
function loadProgressFromLocalStorage(): UserProgress | null {
  try {
    const cached = localStorage.getItem('userProgress');
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    return {
      lastCompletedLocation: BigInt(parsed.lastCompletedLocation || 0),
      totalLocations: BigInt(parsed.totalLocations || 3),
      completedLocations: (parsed.completedLocations || []).map((n: any) => BigInt(n)),
      mainProgress: parsed.mainProgress || {
        stage1: false,
        stage2: false,
        stage3: false,
      },
      currentSequences: (parsed.currentSequences || []).map((n: any) => BigInt(n)),
    };
  } catch (error) {
    console.error('Failed to load progress from localStorage:', error);
    return null;
  }
}

// Helper to mark progress as unsynced in localStorage (for offline mode)
function markProgressAsUnsynced(): void {
  try {
    const cached = localStorage.getItem('userProgress');
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.synced = false;
      parsed.timestamp = Date.now();
      localStorage.setItem('userProgress', JSON.stringify(parsed));
      console.log('⚠️ Progress marked as unsynced in localStorage');
    }
  } catch (error) {
    console.error('Failed to mark progress as unsynced:', error);
  }
}

// Helper to check if there's unsynced progress in localStorage
function hasUnsyncedProgress(): boolean {
  try {
    const cached = localStorage.getItem('userProgress');
    if (!cached) return false;
    const parsed = JSON.parse(cached);
    return parsed.synced === false;
  } catch {
    return false;
  }
}

// Helper to verify progress was saved correctly by re-fetching from backend with retry
async function verifyProgressSaved(
  actor: any,
  expectedLocationId: string,
  maxRetries: number = 3
): Promise<{ verified: boolean; progress?: UserProgress; error?: string }> {
  const locationNumber = expectedLocationId === 'location_1' ? BigInt(1) : 
                        expectedLocationId === 'location_2' ? BigInt(2) : BigInt(3);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Verifying progress save (attempt ${attempt}/${maxRetries})...`);
      
      // Exponential backoff delay to allow backend to process
      const delay = 300 * Math.pow(2, attempt - 1); // 300ms, 600ms, 1200ms
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const progress = await actor.getUserProgress();
      
      // Check if the location was actually saved in backend's persistent Map
      const isSaved = progress.completedLocations.some((loc: bigint) => loc === locationNumber);
      
      if (isSaved) {
        console.log(`✅ Progress VERIFIED - location ${expectedLocationId} confirmed in backend persistent Map (attempt ${attempt})`);
        return { verified: true, progress };
      } else {
        console.warn(`⚠️ Progress verification failed - location ${expectedLocationId} not found in backend (attempt ${attempt}/${maxRetries})`);
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying verification in ${delay * 2}ms...`);
        }
      }
    } catch (error: any) {
      console.error(`✗ Progress verification error (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        return { verified: false, error: error?.message || 'Verification failed' };
      }
    }
  }
  
  return { verified: false, error: 'Progress not found in backend after all verification attempts' };
}

// Helper to sync unsynced progress from localStorage to backend
async function syncUnsyncedProgress(actor: any): Promise<boolean> {
  if (!hasUnsyncedProgress()) {
    return true;
  }

  try {
    console.log('🔄 Syncing unsynced progress from localStorage to backend...');
    const cachedProgress = loadProgressFromLocalStorage();
    
    if (!cachedProgress) {
      console.log('ℹ️ No cached progress to sync');
      return true;
    }

    // Get current backend progress
    const backendProgress = await actor.getUserProgress();
    
    // Merge cached progress with backend progress (backend is source of truth)
    // Only sync locations that are in cache but not in backend
    const newLocations = cachedProgress.completedLocations.filter(
      loc => !backendProgress.completedLocations.some((bLoc: bigint) => bLoc === loc)
    );

    if (newLocations.length === 0) {
      console.log('✅ No new locations to sync - backend is up to date');
      // Mark as synced
      const cached = localStorage.getItem('userProgress');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.synced = true;
        localStorage.setItem('userProgress', JSON.stringify(parsed));
      }
      return true;
    }

    // Sync each new location
    for (const locationNum of newLocations) {
      const locationId = `location_${locationNum}`;
      console.log(`🔄 Syncing location ${locationId} to backend...`);
      
      try {
        await actor.updateProgress(locationId, cachedProgress.currentSequences);
        console.log(`✅ Location ${locationId} synced successfully`);
      } catch (error) {
        console.error(`✗ Failed to sync location ${locationId}:`, error);
        return false;
      }
    }

    // Mark as synced
    const cached = localStorage.getItem('userProgress');
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.synced = true;
      localStorage.setItem('userProgress', JSON.stringify(parsed));
    }

    console.log('✅ All unsynced progress synced to backend');
    return true;
  } catch (error) {
    console.error('✗ Failed to sync unsynced progress:', error);
    return false;
  }
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error('Profile fetch error:', errorMsg);
        
        // Return null for expected "not found" cases (new users)
        if (errorMsg.includes('not found') || 
            errorMsg.includes('Unauthorized') ||
            errorMsg.includes('No profile')) {
          return null;
        }
        
        // Throw for actual errors (network, backend down, etc.)
        throw new Error(`Failed to fetch profile: ${errorMsg}`);
      }
    },
    enabled: !!actor && !actorFetching,
    ...RETRY_CONFIG,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_, profile) => {
      queryClient.setQueryData(['currentUserProfile'], profile);
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    ...RETRY_CONFIG,
  });
}

export function useGetStoryLocation() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        console.log(`📤 Fetching story location: ${id}`);
        const location = await actor.getStoryLocation(id);
        
        // If location is null, provide a fallback
        if (!location) {
          console.warn(`⚠️ Story location "${id}" not found, returning null`);
          return null;
        }
        
        console.log(`✓ Story location fetched successfully:`, location);
        return location;
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error('✗ Story location fetch error:', errorMsg);
        
        // Return null instead of throwing for missing locations
        if (errorMsg.includes('not found') || errorMsg.includes('Unauthorized')) {
          return null;
        }
        
        throw new Error(`Failed to fetch story location: ${errorMsg}`);
      }
    },
    retry: 3, // Retry 3 times for story fetching
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // 1s, 2s, 3s
  });
}

// Fallback quest tasks for locations (since backend doesn't have these methods)
export function useGetLocation1QuestTask() {
  return useMutation({
    mutationFn: async (): Promise<QuestTask> => {
      // Return fallback quest task for Location 1
      return {
        message: "Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?",
        audioFile: "ElevenLabs_Text_to_Speech_audio.mp3"
      };
    },
  });
}

export function useGetLocation2Task() {
  return useMutation({
    mutationFn: async (): Promise<QuestTask> => {
      // Return fallback quest task for Location 2
      return {
        message: "Find the memorial/park marker dedicated to the battle. What year did this clash take place?",
        audioFile: "Location_2_audio.mp3"
      };
    },
  });
}

export function useGetUserProgress() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProgress | null>({
    queryKey: ['userProgress'],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        console.log('📤 Fetching user progress from backend persistent Map (primary source of truth)...');
        
        // First, try to sync any unsynced progress from localStorage
        await syncUnsyncedProgress(actor);
        
        // Fetch from backend's persistent Map (primary source of truth)
        const backendProgress = await actor.getUserProgress();
        console.log('✅ Progress fetched from backend persistent Map:', backendProgress);
        
        // Validate the progress structure
        if (!backendProgress || typeof backendProgress !== 'object') {
          throw new Error('Invalid progress structure from backend');
        }
        
        // Ensure BigInt fields are properly typed
        const validatedProgress: UserProgress = {
          lastCompletedLocation: typeof backendProgress.lastCompletedLocation === 'bigint' 
            ? backendProgress.lastCompletedLocation 
            : BigInt(backendProgress.lastCompletedLocation || 0),
          totalLocations: typeof backendProgress.totalLocations === 'bigint'
            ? backendProgress.totalLocations
            : BigInt(backendProgress.totalLocations || 3),
          completedLocations: Array.isArray(backendProgress.completedLocations)
            ? backendProgress.completedLocations.map(n => typeof n === 'bigint' ? n : BigInt(n))
            : [],
          mainProgress: backendProgress.mainProgress || {
            stage1: false,
            stage2: false,
            stage3: false,
          },
          currentSequences: Array.isArray(backendProgress.currentSequences)
            ? backendProgress.currentSequences.map(n => typeof n === 'bigint' ? n : BigInt(n))
            : [],
        };
        
        // Save to localStorage as backup cache only
        saveProgressToLocalStorage(validatedProgress);
        
        return validatedProgress;
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error('✗ Backend progress fetch error:', errorMsg);
        
        // If backend fails, try localStorage as temporary fallback
        console.log('⚠️ Attempting to load progress from localStorage backup (temporary fallback)...');
        const cachedProgress = loadProgressFromLocalStorage();
        
        if (cachedProgress) {
          console.log('💾 Loaded progress from localStorage backup (will sync with backend when available):', cachedProgress);
          // Mark as unsynced since we couldn't reach backend
          markProgressAsUnsynced();
          return cachedProgress;
        }
        
        // Return default progress structure if both backend and localStorage fail
        console.log('ℹ️ No cached progress, returning default structure');
        return {
          lastCompletedLocation: BigInt(0),
          totalLocations: BigInt(3),
          completedLocations: [],
          mainProgress: {
            stage1: false,
            stage2: false,
            stage3: false,
          },
          currentSequences: [],
        };
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 0, // Always fetch fresh data from backend on mount
    gcTime: 120000, // 2 minutes
    retry: 3, // Retry 3 times to ensure we get backend data
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000), // 500ms, 1000ms, 2000ms
  });
}

export function useUpdateUserProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, workingSequences = [] }: { locationId: string; workingSequences?: bigint[] }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      console.log('📤 Saving progress to backend persistent Map:', { locationId, workingSequences });
      
      // Ensure workingSequences are properly converted to BigInt array
      const sequences = workingSequences.map(seq => 
        typeof seq === 'bigint' ? seq : BigInt(seq)
      );
      
      try {
        // Step 1: Call backend to save progress to persistent Map
        console.log('🔄 Step 1: Calling backend updateProgress...');
        const result = await actor.updateProgress(locationId, sequences);
        console.log('✅ Step 1 complete: Backend updateProgress returned:', result);
        
        // Validate that the result has the expected structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response from backend');
        }
        
        // Step 2: Verify the location was actually saved by checking the result
        const locationNumber = locationId === 'location_1' ? BigInt(1) : 
                              locationId === 'location_2' ? BigInt(2) : BigInt(3);
        
        const isSavedInResult = result.completedLocations.some((loc: bigint) => loc === locationNumber);
        
        if (!isSavedInResult) {
          console.warn('⚠️ Location not found in immediate response, performing verification refetch...');
          
          // Step 3: Verify by re-fetching from backend with retry logic
          console.log('🔄 Step 2: Verifying progress with backend refetch (up to 3 attempts with exponential backoff)...');
          const verification = await verifyProgressSaved(actor, locationId, 3);
          
          if (verification.verified && verification.progress) {
            console.log('✅ Step 2 complete: Progress VERIFIED through refetch');
            // Save verified progress to localStorage as backup
            saveProgressToLocalStorage(verification.progress);
            return verification.progress;
          } else {
            throw new Error(verification.error || 'Failed to verify progress was saved to backend persistent Map');
          }
        }
        
        console.log('✅ Progress confirmed saved to backend persistent Map');
        
        // Save to localStorage as backup cache with synced flag
        saveProgressToLocalStorage(result);
        
        return result;
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error('✗ Backend updateProgress error:', errorMsg);
        
        // Check if it's a network error - save to localStorage for later sync
        if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
          console.log('⚠️ Network error detected - saving to localStorage for later sync');
          
          // Get current progress from cache or create new
          const currentProgress = loadProgressFromLocalStorage() || {
            lastCompletedLocation: BigInt(0),
            totalLocations: BigInt(3),
            completedLocations: [],
            mainProgress: { stage1: false, stage2: false, stage3: false },
            currentSequences: [],
          };
          
          // Add the new location to cached progress
          const locationNumber = locationId === 'location_1' ? BigInt(1) : 
                                locationId === 'location_2' ? BigInt(2) : BigInt(3);
          
          if (!currentProgress.completedLocations.includes(locationNumber)) {
            const newCompletedLocations = [...currentProgress.completedLocations, locationNumber];
            const completedCount = newCompletedLocations.length;
            
            const updatedProgress: UserProgress = {
              lastCompletedLocation: locationNumber,
              totalLocations: BigInt(3),
              completedLocations: newCompletedLocations,
              mainProgress: {
                stage1: completedCount >= 1,
                stage2: completedCount >= 2,
                stage3: completedCount >= 3,
              },
              currentSequences: sequences,
            };
            
            saveProgressToLocalStorage(updatedProgress);
            markProgressAsUnsynced();
            
            console.log('💾 Progress saved to localStorage - will sync when connection is restored');
          }
          
          throw new Error('Network error. Progress saved locally and will sync when connection is restored.');
        }
        
        // Provide more specific error messages
        if (errorMsg.includes('Invalid location ID') || errorMsg.includes('Location not found')) {
          throw new Error('Location not found. The story locations may not be initialized yet.');
        } else if (errorMsg.includes('Unauthorized')) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        throw new Error(`Failed to update progress: ${errorMsg}`);
      }
    },
    onMutate: async ({ locationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userProgress'] });

      // Snapshot the previous value
      const previousProgress = queryClient.getQueryData<UserProgress>(['userProgress']);

      // Optimistically update to the new value
      if (previousProgress) {
        const locationNumber = locationId === 'location_1' ? BigInt(1) : locationId === 'location_2' ? BigInt(2) : BigInt(3);
        
        // Check if already completed
        if (!previousProgress.completedLocations.includes(locationNumber)) {
          const newCompletedLocations = [...previousProgress.completedLocations, locationNumber];
          const completedCount = newCompletedLocations.length;
          
          const optimisticProgress: UserProgress = {
            ...previousProgress,
            lastCompletedLocation: locationNumber,
            completedLocations: newCompletedLocations,
            mainProgress: {
              stage1: completedCount >= 1,
              stage2: completedCount >= 2,
              stage3: completedCount >= 3,
            },
          };
          
          queryClient.setQueryData(['userProgress'], optimisticProgress);
          console.log('⚡ Optimistic update applied (will be confirmed by backend):', optimisticProgress);
        }
      }

      return { previousProgress };
    },
    onSuccess: async (data) => {
      console.log('✅ Progress update successful, updating cache with verified backend data:', data);
      
      // Set the actual data from backend (persistent Map)
      queryClient.setQueryData(['userProgress'], data);
      
      // Invalidate to trigger refetch and ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      
      // Force immediate refetch to double-check backend state after a delay
      setTimeout(async () => {
        console.log('🔄 Performing final verification refetch from backend...');
        await queryClient.refetchQueries({ queryKey: ['userProgress'] });
      }, 500);
    },
    onError: (error, _, context) => {
      console.error('✗ Progress update mutation error:', error);
      
      // Don't rollback if it's a network error (progress is saved locally)
      const errorMsg = error?.message || String(error);
      if (!errorMsg.includes('Network error') && !errorMsg.includes('saved locally')) {
        // Rollback to previous value on non-network errors
        if (context?.previousProgress) {
          queryClient.setQueryData(['userProgress'], context.previousProgress);
          console.log('↩️ Rolled back to previous progress due to error');
        }
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency with backend
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
    retry: 3, // Retry 3 times for critical progress updates
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000), // 500ms, 1000ms, 2000ms
  });
}

export function useUpdateMainProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stage: bigint) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      return actor.updateMainProgress(stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.refetchQueries({ queryKey: ['userProgress'] });
    },
    ...RETRY_CONFIG,
  });
}

export function useGetAllLocationsWithCoordinates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PublicLocationInfo[]>({
    queryKey: ['allLocations'],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        console.log('📤 Fetching all locations with coordinates...');
        const locations = await actor.getAllLocationsWithCoordinates();
        console.log('✓ Fetched locations:', locations);
        
        // If empty, try to fetch all story locations as fallback
        if (!locations || locations.length === 0) {
          console.log('⚠️ No locations found, attempting to fetch all story locations...');
          try {
            const storyLocations = await actor.getAllStoryLocations();
            console.log('✓ Fetched story locations:', storyLocations);
            return storyLocations.map(loc => ({
              id: loc.id,
              title: loc.title,
              sequenceNumber: loc.sequenceNumber,
              coordinates: loc.coordinates,
            }));
          } catch (storyError) {
            console.error('✗ Failed to fetch story locations:', storyError);
            return [];
          }
        }
        
        return locations;
      } catch (error: any) {
        console.error('✗ Locations fetch error:', error);
        // Return empty array on error to not block the app
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

export function useInitializeLocations() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        console.log('📤 Calling backend initializeLocations...');
        await actor.initializeLocations();
        console.log('✓ Story locations initialized successfully');
        return true;
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error('✗ Location initialization error:', errorMsg);
        
        // If unauthorized (not admin), that's expected - locations might already exist
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('Only admins')) {
          console.log('ℹ️ Not admin - locations should already be initialized');
          return false;
        }
        
        throw error;
      }
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['allLocations'] });
        queryClient.invalidateQueries({ queryKey: ['storyLocations'] });
      }
    },
    retry: 1,
  });
}

export function useVerifyLocationsInitialized() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['locationsInitialized'],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        console.log('📤 Verifying story locations are initialized...');
        const locations = await actor.getAllStoryLocations();
        const isInitialized = locations && locations.length > 0;
        console.log(`✓ Story locations ${isInitialized ? 'are' : 'are NOT'} initialized (${locations.length} locations)`);
        return isInitialized;
      } catch (error: any) {
        console.error('✗ Failed to verify locations:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

