# QR Code Story Trail App

## Overview
A mobile-friendly web application that allows users to scan QR codes to unlock and experience location-based stories through text and audio content in Kokkola, Finland. Users progress through a predefined sequence of locations, with each QR code revealing the next part of the narrative. The app features an interactive map with real-time location tracking and an adventure game-themed interface optimized for handheld devices.

## Core Features

### Mobile-Optimized Adventure UI
- Touch-friendly interface designed specifically for handheld devices
- All buttons and interactive elements sized appropriately for finger taps
- Responsive layouts that adapt to various mobile screen sizes
- High-quality Kokkola landscape background image (`kokkola pic.jpg`) with immediate loading and proper caching
- Polished UI elements styled like a professional adventure game
- Simple arrow icon back button positioned at the bottom of every page for easy thumb access on mobile devices with darker color feedback when tapped
- Golden ratio alignment for all main UI elements (map, story panels, buttons, etc.) to create harmonious and visually appealing layouts
- Optimized screen space utilization with minimal empty space at the bottom of all screens
- Compact vertical layout with reduced scroll length for better mobile experience
- Progress bar on main screen showing user's story/location completion progress with dynamic updates
- English language content throughout the application

### Enhanced Background Image Loading and Performance
- Immediate background image loading using `kokkola pic.jpg` without blur-up transitions or progressive loading effects
- Direct image preloading in global CSS and HTML to ensure instant appearance
- Optimized image caching with proper HTTP cache headers and browser storage
- Asynchronous background image initialization that does not block profile loading or app functionality
- Correct image paths and resource loading verification for all assets including `kokkola pic.jpg`
- Full-screen coverage maintained with proper scaling and positioning across all mobile devices
- Modern browser caching techniques with service worker support
- Optimized image formats and compression for mobile performance
- Proper image preloading with priority hints in HTML head section
- Background image loading completely independent of profile fetch operations

### App Flow and Authentication
- App starts with a Home/Login screen where users can log in or set up their profile
- After successful login or profile setup, users transition to the main game screen
- Once logged in, users remain on the main game screen and do not see the Home/Login screen again until they log out
- Logout functionality redirects users back to the Home/Login screen
- Clean two-step flow: Home/Login → Main Game Screen
- No unwanted intermediate screens or transitions beyond this core flow
- Robust profile loading logic that handles errors gracefully without getting stuck

### Enhanced Profile Loading with Guaranteed Fallback System
- Asynchronous profile loading with configurable timeout (5 seconds) and automatic retry mechanisms
- Multiple retry attempts with exponential backoff to handle temporary network issues
- Guaranteed fallback logic within App.tsx that prevents the "Loading Profile" screen from getting stuck
- Automatic retry of profile fetching after timeout with clear user feedback
- Graceful transition to ProfileSetupPage or HomePage even if profile data is delayed or fails
- Error message display when backend cannot be reached instead of freezing the application
- Default guest profile fallback when all loading attempts fail to prevent indefinite loading states
- Comprehensive error handling that gracefully degrades to guest mode without blocking app functionality
- User feedback during profile loading with spinner, progress indicators, and clear status messages
- Retry button functionality when profile fetch exceeds timeout threshold with manual retry option
- Lazy-loading of map and QR scanner components that initialize only after successful profile loading or guest fallback
- Optimized component initialization to eliminate perceived lag and improve app responsiveness
- Proper query caching and invalidation to prevent redundant API calls and refetch loops
- Smooth visual transitions maintained throughout performance improvements
- Streamlined initialization process that prioritizes user experience over perfect data loading
- Fallback mechanisms ensure the app remains functional even with backend connectivity issues
- Background image loading operates independently and does not interfere with profile loading operations
- Loading spinner disappears immediately after timeout or error resolution
- Optimized React Query hooks to prevent redundant refetch loops and handle failed requests properly
- Tested transitions between login, profile setup, and main game screens to ensure smooth, responsive flow without lag or hang

### Main Screen Layout
- First heading displays "The Mystery of Kokkola"
- Subtitle "Discover a great hidden story in the city" positioned directly below the main heading
- "Start Your Journey" window features the adventure-main-background image for a game-like visual appeal
- Layout optimized for mobile devices with visually appealing, adventure-themed styling
- Accessible after successful login with smooth transition from Home/Login screen

### Main Screen Text Styling
- All text on main screens (before and after login, and before starting adventure) uses solid black color (`#000000`) for high contrast and better readability against the Kokkola landscape background
- Black text color applies to titles, subtitles, captions, and button text on pre-adventure screens
- Consistent theme and layout positioning maintained while improving text visibility
- Other color accents (buttons, hover/tap effects) remain unchanged to preserve adventure style
- Enhanced readability while maintaining the overall golden ratio layout and mobile-friendly adventure aesthetic

### Profile Setup Text Styling
- All text within the "Create Your Profile" window uses solid black color (`#000000`) for optimal visibility and enhanced contrast
- Black text color applies consistently to headings, labels, placeholders, button text, and all other text elements in the profile setup interface
- Profile setup text styling maintains high readability against the adventure-themed background
- Existing layout, styles, and functionality preserved without altering other parts of the game UI or navigation
- Enhanced visibility for profile creation elements while maintaining the game's visual theme and adventure aesthetic
- Improved legibility and visual contrast with the adventure-themed backgrounds across all mobile device screen sizes

### Story Progress Text Styling and Dynamic Updates
- All text within the "Story Progress" section uses pure white color (`#FFFFFF`) for optimal visibility and enhanced contrast
- White text color applies consistently to progress window titles, subtitles, labels, percentages, and descriptive text
- Progress-related text styling maintains high readability across both light and dark modes and all mobile screen sizes
- Button colors and map-related text colors remain unchanged to preserve the overall adventure aesthetic
- Enhanced visibility for progress tracking elements while maintaining the game's visual theme
- Improved legibility and visual contrast with the adventure-themed backgrounds
- Consistent white text styling preserved against the high-quality Kokkola landscape background
- Story Progress window text remains clearly visible and readable across all mobile device screen sizes
- Dynamic progress indicator showing "X of 3 locations discovered" that updates immediately when QR codes are scanned
- Progress bar fills incrementally (1/3, 2/3, 3/3) as locations are completed with automatic refresh after each scan
- Progress details view displays only total progress and completion stats, omitting the "Location Details" section

### User Profile Management
- User authentication and profile setup on Home/Login screen
- Profile creation and management with proper validation
- Robust profile loading that handles errors and edge cases gracefully with comprehensive timeout, retry, and guest fallback mechanisms
- Profile data persistence across sessions with fallback to guest mode when needed
- Secure session management for authenticated users
- Error handling for profile operations that provides clear feedback to users
- Multiple fallback mechanisms for profile loading failures with user-friendly retry options and guest mode
- Optimized profile loading performance with proper caching strategies and streamlined initialization
- Guest profile functionality that allows app usage without full authentication when backend is unavailable

### Interactive Map with Enhanced Location Markers
- Compact, mobile-optimized map of Kokkola, Finland using React map library (Leaflet or MapLibre GL JS)
- Smaller map window with reduced side margins for better mobile screen utilization
- Custom adventure game theme styling for the map using provided background assets
- Real-time user location tracking using device geolocation API
- Custom map markers and icons for story locations using provided assets
- Touch-friendly map controls and interactions
- Golden ratio proportions for map sizing and positioning
- Lazy-loaded initialization after successful profile loading or guest fallback for improved performance
- Location 1 marker displayed at coordinates 63.83993° N, 23.12778° E with enhanced marker popup
- Location 1 marker displays title "Neristan – The Old Wooden Town" and popup description "Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?"
- Location 2 marker displayed at coordinates 63.859999° N, 23.118352° E (Halkokari skirmish monument)
- Both user location and quest location markers visible simultaneously on the map
- Interactive marker popups with location titles and descriptive text for enhanced user experience

### QR Code Scanner
- Built-in camera-based QR code scanner that works directly in the browser
- Mobile-optimized interface for easy scanning on handheld devices
- Adventure-themed scanner interface using provided scanner icon
- Touch-friendly scanner controls and feedback
- Lazy-loaded initialization after successful profile loading or guest fallback for improved performance

### QR Code Integration and Quest Tasks with Enhanced Progress Persistence System
- QR code scanning triggers centered "Quest Task" popup display with specific task messages
- **Compact, centered Quest Task popup modal (QuestTaskPopup.tsx) with smaller size (max-w-sm to max-w-md) optimized for mobile devices**
- **Perfect vertical and horizontal centering with proper responsive positioning**
- **Streamlined popup interface containing only essential elements:**
  1. **Story title** displayed prominently at the top with clear typography
  2. **Quest message/body text** in the main content area with proper formatting
  3. **Simplified audio controls** with only play/pause and mute/unmute buttons (no volume or progress sliders)
  4. **"Done" button** at the bottom that triggers the enhanced persistent progress saving mechanism
- Location 1 QR code (from Location_1.png) displays the quest task: "Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?"
- Location 2 QR code (from Location_2.png) displays the quest task: "Find the memorial/park marker dedicated to the battle. What year did this clash take place?"
- Simultaneous audio playbook functionality with custom adventure-themed controls using provided play/pause button assets
- Location 1 plays the audio file "ElevenLabs_Text_to_Speech_audio.mp3" when scanned
- Location 2 plays the audio file "Location_2_audio.mp3" when scanned
- **Enhanced Persistent Progress Saving Mechanism with Dual-Layer Reliability:**
  - **Primary backend persistence via updateProgress function with immediate in-memory Map storage**
  - **Automatic localStorage fallback caching for network error scenarios**
  - **Progress confirmation via getUserProgress refetch with 3 retry attempts and exponential backoff**
  - **"Done" button waits for backend confirmation before closing Quest Task popup modal**
  - **Automatic sync of cached localStorage progress with backend upon next successful connection**
  - **Edge case handling for app reload, offline mode, and session timeout scenarios**
  - **Progress consistency maintained across all user interaction patterns**
- Touch-friendly popup controls for closing and audio management
- Responsive popup design that adapts to different mobile screen orientations
- **Mandatory implementation of custom BigInt serialization utilities from `lib/bigint-utils.ts` across all QR scanning workflows**
- **Custom JSON replacer and reviver functions integrated into ScannerView.tsx for safe BigInt handling in all QR scanner API calls**
- **Safe localStorage operations with BigInt-to-string conversion for QR scan data persistence**
- **Robust BigInt deserialization in story data parsing to prevent JSON.stringify errors**
- **QR scanner parsing logic updated to safely handle BigInt-based story identifiers and sequence numbers**
- **Automatic BigInt conversion in all story fetch operations to ensure smooth data transport**
- **Error-free story loading for both Location 1 and Location 2 with proper BigInt handling**
- **Fallback mechanisms for BigInt serialization failures that maintain app functionality**
- **Validated QR scan event flow with comprehensive BigInt safety measures**
- Robust fallback handling when story data is missing or unavailable, displaying appropriate placeholder content instead of error messages
- Frontend ScannerView correctly references story IDs ("location_1", "location_2") when QR codes are scanned
- Graceful error handling prevents crashes when story locations are not found, showing user-friendly messages
- Fallback quest task content displayed when backend story data is unavailable
- Automatic story data initialization when story locations are not yet available
- Enhanced QR code validation to eliminate "Invalid QR code" errors for registered locations
- Automatic story location re-initialization if lookup fails during QR scanning
- **Guaranteed story loading mechanism with automatic retry and fallback reinitialization if getAllStoryLocations returns empty data**
- **Clear but non-blocking error messages when story data fails to load, with automatic retry after safe delay**
- **Improved error reporting that provides user feedback without blocking the scanning experience**

### Enhanced Persistent Progress Saving System
- **Backend Map Storage Enhancement:**
  - **Improved updateProgress function in main.mo ensures reliable in-memory persistence to userProgress Map**
  - **Immediate Map storage confirmation with atomic write operations**
  - **Enhanced getUserProgress function for consistent progress retrieval across sessions and reloads**
  - **Progress data integrity validation before and after Map storage operations**
- **Frontend Synchronization with React Query:**
  - **Updated useQueries.ts hooks to fetch progress data immediately after successful updateProgress calls**
  - **3-attempt retry mechanism with exponential backoff for progress data synchronization**
  - **QuestTaskPopup.tsx "Done" button waits for backend updateProgress confirmation before modal closure**
  - **HomePage.tsx automatically reloads progress state upon update confirmation**
- **Dual-Layer Persistence Guarantee:**
  - **Primary: Backend Map storage for permanent progress persistence**
  - **Fallback: localStorage temporary caching during network errors or offline scenarios**
  - **Automatic sync of cached localStorage progress with backend upon successful reconnection**
  - **Progress consistency maintained across app reload, offline mode, and session timeout edge cases**
- **Comprehensive Edge Case Testing:**
  - **App reload scenarios with immediate progress restoration from backend Map storage**
  - **Offline mode functionality with localStorage fallback and automatic backend sync**
  - **Session timeout handling with progress recovery from persistent backend storage**
  - **Network interruption resilience with automatic retry and sync mechanisms**
- **No Visual or Layout Changes:**
  - **All existing UI components, styling, colors, and layouts remain unchanged**
  - **Progress saving enhancements operate transparently without affecting user interface**
  - **Adventure theme and mobile optimization preserved throughout progress system improvements**

### Story Content Display and Audio Controls
- Mobile-responsive text narratives associated with scanned QR codes
- Audio playbook functionality with custom adventure-themed controls using provided play/pause button assets
- Touch-friendly audio controls optimized for mobile interaction
- **Streamlined audio controls with play/pause and mute/unmute functionality only (no volume or progress sliders)**
- Accessibility features for audio content
- Support for both text-only and audio-enhanced stories
- Adventure game-styled content presentation using provided story panel backgrounds
- Golden ratio proportions for story panel sizing and text layout
- Quest Task popup system for displaying location-specific tasks and clues
- Fallback content display when story data is missing or corrupted
- Safe parsing and display of location data retrieved from backend with clear fallbacks

### Story Progression and Progress Tracking
- Each QR code links to the next location in a predefined sequence
- Linear story progression through multiple locations on the map
- Clear indication of current progress and next steps with visual map markers
- Progress completion indicators using provided check mark assets
- Mobile-friendly progress display
- Visual progress bar showing completion percentage on main screen with immediate updates after QR scans
- Progress bar accurately reflects discovered locations out of 3 total locations
- Location 1 represents the first step in the adventure sequence
- Location 2 represents the second step in the adventure sequence
- Progress bar fills to 1/3 when Location 1 QR code is successfully scanned with instant visual feedback
- Progress bar fills to 2/3 when Location 2 QR code is successfully scanned with instant visual feedback
- Dynamic progress indicator updates immediately to show "1 of 3 locations discovered" after first scan
- Dynamic progress indicator updates immediately to show "2 of 3 locations discovered" after second scan
- Each additional scanned location increments progress up to 3/3 completion with instant visual feedback
- Automatic progress bar and counter refresh triggered by successful QR scan events with proper React Query refetch
- Progress tracking logic ensures immediate UI updates without manual refresh using optimized state management

### Audio Preloading and Optimized Playback
- Story audio files preloaded immediately when the app initializes to prevent playback delays
- Audio preloading for "ElevenLabs_Text_to_Speech_audio.mp3" and "Location_2_audio.mp3" occurs in background during app startup
- Preloaded audio files cached in browser memory for instant playback when QR codes are scanned
- Audio playback starts immediately upon successful QR code scan without buffering delays
- Enhanced audio loading with proper error handling and fallback mechanisms
- Audio preloading does not interfere with other app initialization processes
- Optimized audio file compression and format selection for mobile devices
- Audio controls respond instantly to user interaction with preloaded content
- Audio playback performance optimized for smooth, lag-free experience during gameplay

### Enhanced Frontend Responsiveness and Data Synchronization with BigInt Safety
- ScannerView and useQueries hooks optimized for instant data synchronization after QR code scans
- React Query cache management streamlined to eliminate redundant API calls and reduce latency
- Optimistic UI updates implemented for progress tracking to provide immediate visual feedback
- Frontend state management optimized to minimize re-renders and improve responsiveness
- QR-triggered events processed with minimal delay through optimized event handling
- Story popup loading optimized with preloaded content and instant display
- Enhanced component rendering performance for smooth user interactions
- Reduced JavaScript execution time for QR scan processing and progress updates
- Streamlined data flow between scanner, progress tracking, and UI components
- Optimized React Query configuration with aggressive caching and instant invalidation strategies
- **Safe parsing and handling of backend responses with comprehensive BigInt serialization protection using lib/bigint-utils.ts**
- **JSON-safe data handling throughout the frontend with custom BigInt replacer/reviver functions**
- **BigInt-aware React Query cache operations that prevent serialization errors**
- **Robust BigInt deserialization in all frontend data processing workflows**
- **Integration of consistent JSON.stringify handler across HomePage.tsx and all React Query mutations**

### User Progress Tracking and Persistence
- **Enhanced Backend Map Storage with Immediate Persistence:**
  - **Backend stores user progress using reliable Map keyed by user principal with atomic write operations**
  - **Improved updateProgress function ensures immediate in-memory persistence to userProgress Map**
  - **Enhanced getUserProgress function provides consistent progress retrieval across sessions and reloads**
  - **Progress data integrity validation before and after all Map storage operations**
- **Frontend React Query Synchronization:**
  - **Updated useQueries.ts hooks fetch progress data immediately after successful updateProgress calls**
  - **3-attempt retry mechanism with exponential backoff for progress data synchronization**
  - **HomePage.tsx automatically reloads progress state upon update confirmation**
  - **Optimized React Query cache invalidation for immediate UI updates**
- **Dual-Layer Persistence System:**
  - **Primary: Backend Map storage for permanent, reliable progress persistence**
  - **Fallback: localStorage temporary caching during network errors or offline scenarios**
  - **Automatic synchronization of cached localStorage progress with backend upon successful reconnection**
  - **Progress consistency maintained across all edge cases and user interaction patterns**
- Users can continue their story trail from where they left off with enhanced reliability
- Progress persists across browser sessions through reliable backend Map storage with atomic updates
- Visual progress tracking on the interactive map and main screen progress bar
- Guest mode progress tracking in local storage when backend is unavailable
- Progress tracking includes completed quest tasks and scanned QR codes
- Immediate progress updates after successful QR code validation with instant backend synchronization
- Backend progress persistence via optimized Motoko updateProgress function called immediately after scan validation
- QR scan events properly flag current location as completed and increment progress stage with atomic backend updates
- Consistent progress data across sessions with reliable backend synchronization and proper React Query cache invalidation
- Frontend refetch logic using React Query ensures HomePage progress data updates immediately after QR scans
- Progress tracking maintains data consistency between frontend state and backend canister storage
- Enhanced error recovery ensures progress is never lost even when individual update attempts fail
- Fixed progress update synchronization for both Location 1 and Location 2 with instant updates and reliable confirmation
- JSON-compatible progress data formatting to prevent serialization conflicts
- Safe handling of all numeric values to prevent BigInt serialization errors
- **Enhanced progress persistence triggered by "Done" button** with dual-layer storage (backend Map + localStorage)
- **Reliable progress restoration** from persistent backend Map storage on app initialization with automatic synchronization

### Offline Functionality
- Previously scanned content cached in browser storage
- Users can review completed story segments without internet connection
- Seamless transition between online and offline modes
- Cached quest task content and audio files for offline replay

### Adventure Game UI Theme
- Visually rich, game-like appearance with high-quality Kokkola landscape background (`kokkola pic.jpg`)
- Stylized buttons and controls incorporating provided asset images
- Custom map markers using location marker assets
- Scanner interface using provided scanner icon
- Audio controls using provided play/pause button assets
- Progress indicators using provided completion check assets
- Adventure button backgrounds for all interactive elements
- Consistent adventure theme across all UI components
- Golden ratio-based layout proportions for visual harmony
- Optimized mobile-first design with minimal wasted space and compact vertical layout
- Interactive feedback with darker colors on button taps
- Enhanced UI layer legibility and harmony with optimized background and text contrast
- Adventure-themed Quest Task popup styling with proper contrast and readability
- Centered popup positioning with responsive scaling for different mobile orientations

## Backend Data Storage
The backend must store:
- User authentication data and session management
- User profiles with secure authentication credentials
- QR code identifiers and their associated story content
- Text narratives and audio file URLs for each location
- Quest task messages for each QR code location
- Story sequence and location ordering
- Geographic coordinates (latitude/longitude) for each story location in Kokkola, Finland
- **Enhanced User Progress Tracking with Improved Map Storage:**
  - **Reliable Map keyed by user principal with immediate in-memory persistence**
  - **Progress data structure with completedLocations, lastCompletedLocation, and mainProgress fields**
  - **Atomic write operations with data integrity validation**
  - **Enhanced updateProgress function for reliable progress persistence**
  - **Improved getUserProgress function for consistent progress retrieval across sessions**
- Metadata for each story location (title, description, sequence number, coordinates)
- Location 1 data including QR code identifier, quest task message, audio file reference, title "Neristan – The Old Wooden Town", and coordinates (63.83993° N, 23.12778° E)
- Location 2 data including QR code identifier, quest task message, audio file reference, and coordinates (63.859999° N, 23.118352° E - Halkokari skirmish monument)
- Progress tracking data that supports fractional completion (1/3, 2/3, 3/3) for dynamic progress bar updates with immediate persistence
- Persistent user progress state that maintains completion status across sessions with reliable data consistency
- Enhanced userProgress data structure that supports atomic updates and prevents data corruption during concurrent operations
- Properly initialized story location objects for "Location 1" and "Location 2" that are retrievable through getStoryLocation function
- Story data with standardized identifiers ("location_1", "location_2") that match frontend QR scan references
- Fallback story content for when primary story data is missing or corrupted
- **JSON-serializable data structures with comprehensive BigInt-to-string conversion at all storage points**
- **All numeric values stored in BigInt-safe formats with automatic conversion to JSON-compatible types**
- **Mandatory BigInt serialization handling implemented at all data storage and retrieval operations**
- **Safe data persistence mechanisms that prevent BigInt serialization conflicts**
- **Enhanced persistent progress data with maximum reliability** and dual-layer storage support (backend Map + localStorage fallback)
- **Progress restoration data with comprehensive validation** for app initialization from persistent backend Map storage with automatic synchronization
- **Bulletproof progress data integrity** maintained across app restarts, network interruptions, and edge case scenarios

## Backend Operations
- Handle user authentication (login/logout)
- Manage user profile creation and updates
- Validate user sessions and maintain authentication state
- **Enhanced Progress Persistence Operations:**
  - **Improved updateProgress function in main.mo with reliable in-memory Map storage**
  - **Immediate persistence confirmation with atomic write operations**
  - **Enhanced getUserProgress function for consistent progress retrieval across sessions and reloads**
  - **Progress data integrity validation before and after all Map storage operations**
  - **3-attempt retry mechanism support for frontend synchronization requests**
  - **Optimized response times with minimal processing overhead**
- **Validate scanned QR codes and return associated story content with comprehensive BigInt-safe JSON serialization**
- **Custom JSON serialization functions implemented for all story data responses to prevent BigInt errors**
- **Track and update user progress using proper Map storage keyed by user principal with immediate persistence and maximum reliability**
- **Execute optimized atomic progress updates using updateProgress method that accepts Principal and locationId parameters with bulletproof error handling and 3-attempt retry logic with exponential backoff**
- **Enhanced updateProgress function that validates progress data before updating userProgress Map with minimal processing overhead and returns updated UserProgress object**
- **Streamlined error handling in updateProgress function with proper error codes and descriptive messages for frontend consumption**
- **Progress update operations that are idempotent and handle duplicate requests gracefully without performance impact**
- **Immediate confirmation responses for successful progress updates with updated progress data and minimal payload**
- **Fixed progress update synchronization with aggressive timeout settings (2 seconds maximum) to eliminate timeout and failure errors**
- **Optimized backend processing with minimal execution time and immediate response confirmation**
- **Provide story content (text and audio URLs) for valid QR codes with mandatory BigInt-to-string conversion**
- **Enhanced story content delivery with guaranteed reliability and up to 3 retry mechanisms for network delays or failures**
- **Bulletproof story data loading with automatic fallback initialization when story locations are missing**
- **Provide quest task messages for scanned QR codes with comprehensive BigInt serialization safety**
- Provide geographic coordinates for story locations to display on map
- Handle secure session management for authenticated users
- Robust error handling for authentication and profile operations
- Optimized profile API responses that return results quickly with proper timeout handling
- Efficient backend processing to avoid unnecessary permission checks or delays
- Fast response times for profile loading with comprehensive timeout and retry support
- Graceful degradation when backend services are temporarily unavailable
- Improved error response handling to support frontend fallback mechanisms
- Enhanced API reliability to prevent frontend initialization issues
- **Process Location 1 QR code scans and return quest task content with audio file reference using BigInt-safe JSON formats**
- **Process Location 2 QR code scans and return quest task content with audio file reference using BigInt-safe JSON formats**
- Update progress tracking to reflect completed locations (1/3, 2/3, 3/3) when QR codes are successfully scanned with immediate backend persistence
- Provide Location 1 coordinates (63.83993° N, 23.12778° E) and title "Neristan – The Old Wooden Town" for map marker display
- Provide Location 2 coordinates (63.859999° N, 23.118352° E - Halkokari skirmish monument) for map marker display
- **Execute optimized updateProgress function in Motoko to persist progress changes to Map storage immediately after QR scan validation with atomic operations and minimal latency**
- Ensure backend progress updates are atomic and consistent to prevent data corruption with proper error handling and streamlined execution
- Maintain reliable progress state synchronization between frontend and backend with optimized API responses for React Query
- Support immediate progress data refetch after QR scans to ensure HomePage displays accurate completion status
- Enhanced backend logging and monitoring for progress update operations to facilitate debugging and ensure reliability
- Instant progress update confirmation with reliable backend-frontend synchronization for all locations with sub-second response times
- Properly initialize and maintain story location objects for "Location 1" and "Location 2" with correct identifiers
- Implement robust getStoryLocation function that reliably retrieves story data for "location_1" and "location_2" identifiers
- Provide fallback story content when primary story data is missing, corrupted, or unavailable
- Handle story location retrieval errors gracefully without crashing or returning null responses
- Ensure story data consistency and availability across all backend operations
- Validate story location identifiers and provide appropriate error responses for invalid requests
- Maintain story data integrity through proper initialization and error handling mechanisms
- **Guaranteed getAllStoryLocations initialization with forced fallback reinitialization if data returns empty**
- **Automatic story data initialization when story locations are not yet available**
- **Enhanced story loading mechanism that validates story data by sequence number or ID after QR scan**
- **Convert all Nat and BigInt values to text or number format before frontend transmission using custom serialization functions**
- **Ensure all backend responses are JSON-compatible with comprehensive BigInt handling throughout**
- **Implement mandatory BigInt-to-string conversion at every serialization point for story and progress data**
- **Custom JSON replacer functions for all backend-to-frontend API communications**
- **Safe BigInt deserialization handling in all backend data processing operations**
- **Comprehensive BigInt serialization safety implemented throughout all backend operations and responses**
- Automatic initialization of story locations on first admin or user session if data is missing
- Run initializeLocations() automatically when story data is not available to ensure immediate availability
- Automatic story location initialization on app load to prevent "Story locations are not yet initialized" errors
- Enhanced QR code validation to prevent "Invalid QR code" errors for properly registered Location 2
- Automatic story location re-initialization during QR scanning if story lookup fails
- Robust story data loading with fallback mechanisms to ensure successful story retrieval after QR scanning
- **Verified story loading endpoints return properly serialized objects with comprehensive BigInt safety**
- **Comprehensive testing of scanner event flow with BigInt-safe story data handling**
- **Validated story popup display with correct Quest Task messages and audio playback without any serialization errors**
- **Confirmed scanning Location_1 and Location_2 QR codes produce correct popups, narration, and progress updates with full BigInt safety**
- **Enhanced persistent progress storage with maximum reliability** and dual-layer support (backend Map primary, localStorage fallback)
- **Bulletproof progress restoration API** for app initialization from persistent backend Map storage with automatic synchronization and validation
- **Silent retry mechanisms with exponential backoff (3 attempts)** for failed progress persistence operations with comprehensive error recovery
- **Automatic progress reconciliation with conflict resolution** on next sync cycle when backend calls fail
- **Comprehensive edge case handling** for app restarts, weak network conditions, and data corruption scenarios
- **Network interruption handling with auto-retry on failure and safe restore on reconnect with comprehensive error recovery**
- **Guaranteed persistence across sessions by correctly retrieving saved progress from backend on app reload with automatic fallback to localStorage if offline**
- **Immediate backend sync as soon as connection is restored with conflict resolution and data validation**
- **Asynchronous write operations to persistent backend Map storage triggered immediately when quest is completed**
- **Enhanced retry logic for network or serialization failures to maintain progress data consistency**
- **Clear error reporting and retry status messages for frontend consumption during progress save operations**
- **Comprehensive confirmation responses that indicate success/failure status of progress updates with descriptive messages**
- **Fully reliable progress-saving system that stores progress permanently in backend Map via updateProgress with immediate confirmation after each code scan or "Done" confirmation**
- **Backend persistence verification using refetch after saving with up to 3 retry attempts and exponential backoff**
- **Automatic progress reload on app restart or session reconnect from persistent backend Map storage**
- **localStorage used only as short-term fallback cache while syncing backend state with immediate synchronization when online**
- **Progress data retention during network interruptions with automatic sync once connection is restored**

## Example Data Structure
Each story location should include:
- Unique QR code identifier
- Story title and text content
- Quest task message for popup display
- Optional audio file URL
- Sequence number in the story trail
- Geographic coordinates (latitude, longitude) for Kokkola, Finland
- Next location hint or direction

Location 1 specific data:
- QR code identifier from Location_1.png
- Story identifier: "location_1"
- Title: "Neristan – The Old Wooden Town"
- Quest task message: "Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?"
- Audio file: "ElevenLabs_Text_to_Speech_audio.mp3"
- Sequence number: 1
- Geographic coordinates: 63.83993° N, 23.12778° E
- Progress value: 1/3 completion when scanned with immediate backend persistence

Location 2 specific data:
- QR code identifier from Location_2.png
- Story identifier: "location_2"
- Quest task message: "Find the memorial/park marker dedicated to the battle. What year did this clash take place?"
- Audio file: "Location_2_audio.mp3"
- Sequence number: 2
- Geographic coordinates: 63.859999° N, 23.118352° E (Halkokari skirmish monument)
- Progress value: 2/3 completion when scanned with immediate backend persistence

Fallback story data structure:
- Default quest task message for missing story locations
- Placeholder audio content or silent audio file
- Generic story title and description
- Default coordinates for map display
- Error handling messages for corrupted data

**Enhanced User Progress Data Structure (Backend Map):**
- Map key: User principal
- Map value: Progress record with fields:
  - completedLocations: Array of completed location identifiers
  - lastCompletedLocation: Most recently completed location identifier
  - mainProgress: Fractional progress value (1/3, 2/3, 3/3)
  - timestamp: Last update timestamp for synchronization
- **Atomic write operations with immediate in-memory persistence**
- **Data integrity validation before and after all storage operations**
- **Enhanced updateProgress function for reliable progress persistence**
- **Improved getUserProgress function for consistent progress retrieval**

## Integration Instructions
- QR codes should contain unique identifiers that map to backend story data
- Physical QR codes can be generated using the unique identifiers
- QR codes should be placed at actual locations in Kokkola, Finland referenced in the story
- Each location's QR code reveals that location's quest task and points to the next destination
- Map markers should correspond to actual geographic locations in Kokkola, Finland
- User's real-time location should be displayed relative to story locations on the map
- All UI elements should be optimized for touch interaction on mobile devices
- All main UI elements should follow golden ratio proportions for optimal visual appeal
- Back button should be a simple arrow icon positioned at the bottom for thumb accessibility with darker color feedback when tapped
- App flow: Home/Login screen → Main game screen (after authentication or guest fallback)
- Users remain on main game screen until logout, which returns them to Home/Login screen
- Profile loading must be robust with comprehensive error handling, multiple timeout mechanisms, retry logic, and guest profile fallback
- Main screen should display a progress bar showing story completion percentage with immediate updates after QR scans using React Query refetch
- Progress bar must accurately reflect discovered locations out of 3 total with instant visual feedback
- Vertical layout should be compact to minimize scrolling on mobile devices
- Main screen heading should read "The Mystery of Kokkola" with subtitle "Discover a great hidden story in the city"
- "Start Your Journey" window should use the adventure-main-background image for enhanced visual appeal
- Authentication state management that ensures proper flow between Home/Login and main game screens with guest mode support
- Secure session handling with proper logout functionality
- All text on main screens (before and after login, and before starting adventure) should use solid black color (`#000000`) for optimal readability against the Kokkola landscape background
- All text within the "Create Your Profile" window should use solid black color (`#000000`) for enhanced visibility and improved contrast against adventure-themed backgrounds, while preserving existing layout, styles, and functionality
- All text within the "Story Progress" section and progress window should use pure white color (`#FFFFFF`) for enhanced visibility and improved contrast against adventure-themed backgrounds across all mobile screen sizes
- Progress text styling should maintain consistency across light and dark modes while preserving the adventure aesthetic
- Lazy-loading implementation for map and QR scanner components to improve initial app responsiveness
- Proper query caching and invalidation strategies to minimize redundant API calls and reduce lag
- Comprehensive timeout and retry mechanisms for profile loading with clear user feedback, retry options, and guest mode fallback
- Backend optimization to ensure fast profile API responses and avoid execution delays
- Direct background image loading using `kokkola pic.jpg` with immediate display, proper preloading in global CSS/HTML, and correct resource paths
- Background image initialization must be completely asynchronous and independent of profile loading to prevent Loading Profile screen from stalling
- Optimized image caching and performance with proper HTTP headers and browser storage
- Enhanced UI layer legibility with optimized text contrast and background harmony
- Streamlined initialization process that eliminates perceived lag and ensures app functionality even with backend connectivity issues
- Guest profile system that allows full app functionality when authentication or profile loading fails
- Verification of correct image paths and caching for all image resources including `kokkola pic.jpg`
- Profile setup window text visibility maintained across all mobile device screen sizes with consistent black (#000000) color styling for all text elements including headings, labels, placeholders, and button text
- Story Progress window text visibility maintained across all mobile device screen sizes with consistent white (#FFFFFF) color styling
- Guaranteed fallback logic implementation within App.tsx to prevent "Loading Profile" screen from getting stuck
- Optimized React Query hooks in useQueries.ts to prevent redundant refetch loops and handle failed requests properly
- Immediate loading spinner disappearance after timeout or error resolution
- Tested smooth transitions between login, profile setup, and main game screens without lag or hang
- Location 1 QR code integration with quest task popup and audio playbook functionality
- Location 2 QR code integration with quest task popup and audio playbook functionality
- **Enhanced Quest Task popup (QuestTaskPopup.tsx) with persistent progress saving mechanism:**
  - **Smaller size (max-w-sm to max-w-md), perfect centering, and streamlined content**
  - **"Done" button triggers enhanced persistent progress saving with backend confirmation**
  - **Dual-layer persistence: Backend Map storage + localStorage fallback**
  - **Progress confirmation via getUserProgress refetch with 3 retry attempts**
  - **Automatic sync of cached progress with backend upon reconnection**
  - **Edge case handling for app reload, offline mode, and session timeout**
- **Quest Task popup contains only: story title, quest message, simplified audio controls (play/pause, mute/unmute only), and "Done" button**
- **No volume or progress sliders in Quest Task popup interface**
- **Guaranteed bulletproof story content loading every time popup opens with up to 3 retry attempts and comprehensive fallback handling**
- **Immediate and bulletproof progress persistence when "Done" button is clicked with dual-layer storage (backend Map + localStorage)**
- **Persistent progress across app reloads, sessions, and device restarts with automatic restoration from persistent backend Map storage**
- **Comprehensive edge case handling for network delays, missing story data, connectivity issues, and app restart scenarios**
- **No changes to visual elements, colors, styles, or layout outside the Quest Task popup modal**
- Audio playbook should start automatically when Location 1 or Location 2 QR codes are scanned with preloaded audio files
- Quest Task popup should be dismissible with touch-friendly close controls
- Map marker at coordinates 63.83993° N, 23.12778° E should display title "Neristan – The Old Wooden Town" with popup description "Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?"
- Map marker at coordinates 63.859999° N, 23.118352° E (Halkokari skirmish monument) should be visible alongside user's current location marker for Location 2
- Progress bar should fill to 1/3 and display "1 of 3 locations discovered" when Location 1 QR code is successfully scanned with immediate React Query refetch
- Progress bar should fill to 2/3 and display "2 of 3 locations discovered" when Location 2 QR code is successfully scanned with immediate React Query refetch
- Gameplay flow should guide users to navigate to map markers, scan QR codes, and advance progress smoothly
- Dynamic progress tracking with immediate visual feedback and incremental updates (1/3, 2/3, 3/3) using optimized React Query cache management
- **Streamlined audio controls with play/pause and mute/unmute functionality only (no volume or progress sliders)**
- **Enhanced Progress Persistence Integration:**
  - **QR scan events in ScannerView trigger enhanced persistent progress updates with backend Map confirmation**
  - **Progress tracking logic ensures HomePage progress bar refreshes automatically after successful scans**
  - **Backend updateProgress function called immediately after QR code validation with dual-layer persistence**
  - **Progress updates are atomic and reliable with localStorage fallback during network issues**
  - **React Query cache invalidation triggers immediate refetch with 3-attempt retry mechanism**
  - **Frontend progress state synchronizes with backend Map data using enhanced React Query patterns**
  - **Progress update error handling with exponential backoff and graceful degradation**
  - **Successful progress updates reflect immediately in UI with backend confirmation**
- Fixed progress update synchronization to eliminate all "Update progress taking long and failed at last" errors with instant confirmation and sub-second response times
- Reliable progress tracking for both Location 1 and Location 2 with immediate backend persistence and frontend updates
- Audio preloading implementation for "ElevenLabs_Text_to_Speech_audio.mp3" and "Location_2_audio.mp3" during app initialization
- Preloaded audio files cached in browser memory for instant playback when QR codes are scanned
- Enhanced frontend responsiveness with optimized React Query configuration and streamlined data synchronization
- Optimistic UI updates for progress tracking to provide immediate visual feedback before backend confirmation
- Reduced latency across QR-triggered events and audio playback for smooth gameplay experience
- All existing visual styling, map markers, and background settings maintained unchanged while enhancing performance
- **Backend story location objects must be properly initialized for "Location 1" and "Location 2" with correct identifiers ("location_1", "location_2")**
- Frontend ScannerView must correctly reference story identifiers ("location_1", "location_2") when QR codes are scanned
- Robust fallback handling implemented on both backend and frontend to prevent "Story location not found" errors
- Graceful error handling that displays appropriate placeholder content when story data is missing or corrupted
- Story data retrieval through getStoryLocation function must be reliable and handle missing data gracefully
- Fallback mechanisms ensure continued gameplay functionality even when story data is unavailable
- Error messages replaced with user-friendly placeholder content to maintain immersive experience
- Story location initialization and retrieval must be thoroughly tested to prevent crashes or data corruption
- All previous gameplay behavior, progress tracking, and popup/audio playback features maintained unchanged
- Automatic story data initialization when story locations are not yet available to prevent "Story locations are not yet initialized" errors
- **Comprehensive BigInt serialization safety implemented throughout all QR scanning, story loading, and progress tracking workflows using lib/bigint-utils.ts**
- **Custom JSON replacer and reviver functions deployed across all frontend-backend communications**
- **Safe localStorage operations with BigInt-to-string conversion for all persistent data**
- **Robust BigInt deserialization in all story data parsing and display operations**
- **QR scanner parsing logic updated to safely handle BigInt-based story identifiers and sequence numbers**
- **Automatic BigInt conversion in all story fetch operations to ensure smooth data transport**
- **Error-free story loading for both Location 1 and Location 2 with comprehensive BigInt handling**
- **Fallback mechanisms for BigInt serialization failures that maintain app functionality without errors**
- **UI stability maintained with smooth, fast transitions after scans with zero serialization errors**
- **Validated QR scan event flow with comprehensive BigInt safety measures throughout the entire data pipeline**
- Progress details view displays only total progress and completion stats, omitting the "Location Details" section
- Enhanced QR code validation to eliminate "Invalid QR code" errors for Location 2 by ensuring proper story location registration
- Automatic story location re-initialization during QR scanning if story lookup fails to ensure successful story data loading
- Robust story data loading mechanisms with comprehensive fallback handling to prevent story loading failures after QR scanning
- **Mandatory implementation of safe BigInt-to-String conversion at every point where story or progress data is serialized for frontend or QR scanning interaction**
- **Verified story loading endpoints return properly serialized objects compatible with JSON.stringify with comprehensive BigInt safety**
- **Comprehensive testing of scanner event flow to correctly identify valid QR codes tied to story locations with full BigInt serialization protection**
- **Validated story popup display with correct Quest Task messages and audio playback without any serialization or BigInt mapping errors**
- **Confirmed scanning Location_1 and Location_2 QR codes produce correct popups, narration, and progress updates with complete BigInt serialization safety**
- **Integration of consistent JSON.stringify handler using custom replacer and reviver from lib/bigint-utils.ts across ScannerView.tsx, HomePage.tsx, and all React Query mutation or story-fetching logic**
- **Guaranteed story loading mechanism with automatic retry and fallback reinitialization if getAllStoryLocations returns empty data**
- **Clear but non-blocking error messages when story data fails to load, with automatic retry after safe delay before alerting the user**
- **Improved error reporting that provides user feedback without blocking the scanning experience**
- **Validation that both Location_1 and Location_2 QR codes correctly reveal their associated narratives, audio playback, and progress tracking with no serialization or missing data issues**
- **Enhanced Persistent Progress Saving Integration with No Visual Changes:**
  - **All existing UI components, styling, colors, and layouts remain completely unchanged**
  - **Progress saving enhancements operate transparently without affecting user interface**
  - **Adventure theme and mobile optimization preserved throughout progress system improvements**
  - **Only progress-saving logic and backend communication enhanced**
