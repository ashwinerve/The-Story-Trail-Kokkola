# The-Story-Trail-Kokkola – Interactive Story Adventure Game

# Live app link: https://the-story-trail-kokkola-33g.caffeine.xyz


🎮 Overview:

The Mystery of Kokkola is a mobile-friendly, location-based adventure game built for the city of Kokkola, Finland. Players explore real-world places, scan QR codes, and uncover stories through image and audio clues while their progress is tracked persistently across sessions.

The game blends storytelling, exploration, and technology to create an immersive cultural mystery experience.

🚀 Features:

-Login System: Secure Internet Identity authentication

-Dynamic Story Map: Real-time map of Kokkola with live user GPS tracking

-QR Code Scanning: Built with native browser MediaDevices API (no third-party services)

-Audio Narration: Story playback using built-in HTML5 audio player

-Progress Persistence: Fully reliable backend logic storing progress permanently across sessions

-Offline Sync: Local cache and auto-sync for unstable networks

-Beautiful UI: Game-inspired layout using golden ratio alignment and Kokkola landscape backgrounds

🏗️ Tech Stack:

#Frontend:

-React + TypeScript

-Tailwind CSS for styling and responsive design

-Leaflet.js for live maps

-Web APIs (MediaDevices, Geolocation, HTML5 Audio)

#Backend:

-Motoko language running on Internet Computer Canisters

-Persistent Map structures for user profiles and progress storage

-Role-based access control and data authorization

-On-chain file handling for audio and images

🧩 Key Modules:

#File	Descriptions:

-main.mo	Main logic: stories, locations, and progress management

-access-control.mo	Role & permission handling (Admin, User, Guest)

-Storage.mo / Mixin.mo	File and blob storage for story images & audio

-App.tsx	Handles session, loading, and navigation between game screens

-ScannerView.tsx	QR scanning and quest pop-up logic

-QuestTaskPopup.tsx	Story modal with audio controls and “Done” progress save

-ProgressView.tsx	Displays overall story completion status

🗺️ How It Works:

-Users sign in using Internet Identity.

-The map shows Kokkola story locations; users must physically travel there.

-Scanning a QR code launches a story pop-up with narration.

-On completing each quest, the story progress is saved permanently to the backend.

-Progress is restored automatically when users return later.


🔧 Development Setup:

-Clone or download this repo

-Install dependencies:

-npm install

#Run the frontend locally:

-npm run dev

#For backend (Internet Computer):

-dfx start

-dfx deploy

🧭 Future Plans:

-Add new stories and more locations in Kokkola.

-Expand multiplayer or community features.

-Integrate achievements and leaderboard system.

-Fix progress saving and tracking.

📚 References:

-Internet Computer Association (2024). Available at: https://internetcomputer.org/ (Accessed: 14 December 2025).

-ICP Ninja Library (2024). Available at: https://icp.ninja/ (Accessed: 19 December 2025)

-Motoko programming guide (2025). Available at: https://internetcomputer.org/docs/current/motoko/main/motoko (Accessed: 5 October 2025)

-Leaflet.js Documentation (2024). Available at: https://leafletjs.com/ (Accessed: 10 October 2025)

-Caffeine AI IDE (2025). Available at: https://caffeine.ai/ ((Accessed: 15 September 2025)




