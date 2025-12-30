import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userProgress = Map.empty<Principal, UserProgress>();
  let storyLocations = Map.empty<Text, StoryLocation>();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access backend profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type Coordinates = {
    latitude : Float;
    longitude : Float;
  };

  public type StoryLocation = {
    id : Text;
    title : Text;
    content : Text;
    audioUrl : ?Text;
    sequenceNumber : Nat;
    nextLocationHint : Text;
    coordinates : Coordinates;
  };

  public type PublicLocationInfo = {
    id : Text;
    title : Text;
    sequenceNumber : Nat;
    coordinates : Coordinates;
  };

  public type UserProgress = {
    lastCompletedLocation : Nat;
    completedLocations : [Nat];
    currentSequences : [Nat];
    totalLocations : Nat;
    mainProgress : MainProgress;
  };

  public type MainProgress = {
    stage1 : Bool;
    stage2 : Bool;
    stage3 : Bool;
  };

  func ensureProgressInitialized(user : Principal) : UserProgress {
    switch (userProgress.get(user)) {
      case (?progress) { progress };
      case (null) {
        let initialProgress : UserProgress = {
          lastCompletedLocation = 0;
          completedLocations = [];
          currentSequences = [];
          totalLocations = 3;
          mainProgress = {
            stage1 = false;
            stage2 = false;
            stage3 = false;
          };
        };
        if (AccessControl.hasPermission(accessControlState, user, #user)) {
          userProgress.add(user, initialProgress);
        };
        initialProgress;
      };
    };
  };

  func isLocationCompleted(completedLocations : [Nat], sequenceNumber : Nat) : Bool {
    completedLocations.find(func(completed) { completed == sequenceNumber }) != null;
  };

  public shared ({ caller }) func updateMainProgress(stage : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update progress");
    };

    if (stage < 1 or stage > 3) {
      Runtime.trap("Invalid stage: Must be between 1 and 3");
    };

    var currentProgress = ensureProgressInitialized(caller);

    let updatedMainProgress = switch (stage) {
      case (1) {
        {
          stage1 = true;
          stage2 = currentProgress.mainProgress.stage2;
          stage3 = currentProgress.mainProgress.stage3;
        };
      };
      case (2) {
        {
          stage1 = currentProgress.mainProgress.stage1;
          stage2 = true;
          stage3 = currentProgress.mainProgress.stage3;
        };
      };
      case (3) {
        {
          stage1 = currentProgress.mainProgress.stage1;
          stage2 = currentProgress.mainProgress.stage2;
          stage3 = true;
        };
      };
      case (_) { currentProgress.mainProgress };
    };

    let updatedProgress : UserProgress = {
      currentProgress with
      mainProgress = updatedMainProgress;
    };

    userProgress.add(caller, updatedProgress);
  };

  func getLocationId(sequenceNumber : Nat) : Text {
    switch (storyLocations.values().toArray().find(func(loc) { loc.sequenceNumber == sequenceNumber })) {
      case (?location) { location.id };
      case (null) { "" };
    };
  };

  public query ({ caller }) func getCompletedLocationsCount(locationId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access analytics");
    };

    switch (storyLocations.get(locationId)) {
      case (null) { 0 };
      case (?location) {
        var count = 0;
        for ((_, progress) in userProgress.entries()) {
          let completedLocations = progress.completedLocations;
          if (isLocationCompleted(completedLocations, location.sequenceNumber)) {
            count += 1;
          };
        };
        count;
      };
    };
  };

  public query ({ caller }) func getAllCompletedLocations() : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access analytics");
    };

    let completedLocationsMap = Map.empty<Text, Nat>();

    for ((_, progress) in userProgress.entries()) {
      let completedLocations = progress.completedLocations;
      for (locationId in completedLocations.values()) {
        let count = switch (completedLocationsMap.get(getLocationId(locationId))) {
          case (?existingCount) { existingCount + 1 };
          case (null) { 1 };
        };
        if (getLocationId(locationId) != "") {
          completedLocationsMap.add(getLocationId(locationId), count);
        };
      };
    };

    let entriesArray = completedLocationsMap.toArray();
    entriesArray.map(func(tuple) { tuple });
  };

  public shared ({ caller }) func updateProgress(locationId : Text, workingSequences : [Nat]) : async UserProgress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save progress to backend. Guests should use localStorage.");
    };

    let location = switch (storyLocations.get(locationId)) {
      case (null) { Runtime.trap("Invalid location ID: Location not found") };
      case (?loc) { loc };
    };

    var currentProgress = ensureProgressInitialized(caller);

    let completedLocations = currentProgress.completedLocations;

    if (isLocationCompleted(completedLocations, location.sequenceNumber)) {
      return currentProgress;
    };

    if (location.sequenceNumber < 1 or location.sequenceNumber > currentProgress.totalLocations) {
      Runtime.trap("Invalid sequence number: Out of range (1-" # currentProgress.totalLocations.toText() # ")");
    };

    let newCompletedLocations = completedLocations.concat([location.sequenceNumber]);
    let completedCount = newCompletedLocations.size();
    let updatedMainProgress = {
      stage1 = completedCount >= 1;
      stage2 = completedCount >= 2;
      stage3 = completedCount >= 3;
    };

    let newProgress : UserProgress = {
      lastCompletedLocation = location.sequenceNumber;
      completedLocations = newCompletedLocations;
      currentSequences = workingSequences;
      totalLocations = currentProgress.totalLocations;
      mainProgress = updatedMainProgress;
    };

    userProgress.add(caller, newProgress);
    newProgress;
  };

  func getStoryLocationOrNull(id : Text) : ?StoryLocation {
    storyLocations.get(id);
  };

  public query ({ caller }) func getStoryLocation(id : Text) : async ?StoryLocation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access story content");
    };
    getStoryLocationOrNull(id);
  };

  public query ({ caller }) func getAllStoryLocations() : async [StoryLocation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access story content");
    };
    storyLocations.values().toArray();
  };

  public query ({ caller }) func getAllLocationsWithCoordinates() : async [PublicLocationInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access location data");
    };
    let publicLocations = storyLocations.values().toArray().map(
      func(loc) {
        {
          id = loc.id;
          title = loc.title;
          sequenceNumber = loc.sequenceNumber;
          coordinates = loc.coordinates;
        };
      }
    );
    publicLocations;
  };

  public query ({ caller }) func getAllLocationsCoordinates() : async [PublicLocationInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access location data");
    };
    let locations = storyLocations.values().toArray().map(
      func(loc) {
        {
          id = loc.id;
          title = loc.title;
          sequenceNumber = loc.sequenceNumber;
          coordinates = loc.coordinates;
        };
      }
    );
    locations;
  };

  public query ({ caller }) func getLocationByCoordinates(latitude : Float, longitude : Float) : async ?PublicLocationInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access location data");
    };
    var nearestLocation : ?PublicLocationInfo = null;
    var minDistance : Float = 1000000.0;

    for (location in storyLocations.values()) {
      let distance = calculateDistance(latitude, longitude, location.coordinates.latitude, location.coordinates.longitude);
      if (distance < minDistance) {
        minDistance := distance;
        nearestLocation := ?{
          id = location.id;
          title = location.title;
          sequenceNumber = location.sequenceNumber;
          coordinates = location.coordinates;
        };
      };
    };

    nearestLocation;
  };

  func calculateDistance(lat1 : Float, lon1 : Float, lat2 : Float, lon2 : Float) : Float {
    let earthRadius = 6371.0;
    let dLat = degreesToRadians(lat2 - lat1);
    let dLon = degreesToRadians(lon2 - lon1);

    let a = Float.sin(dLat / 2.0) ** 2.0 + Float.cos(degreesToRadians(lat1)) * Float.cos(degreesToRadians(lat2)) * Float.sin(dLon / 2.0) ** 2.0;
    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    earthRadius * c;
  };

  func degreesToRadians(degrees : Float) : Float {
    degrees * (3.141592653589793 / 180.0);
  };

  public shared ({ caller }) func initializeLocations() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize story locations");
    };

    let location1 : StoryLocation = {
      id = "location_1";
      title = "Neristan – The Old Wooden Town";
      content = "Seek out a porcelain dog in a window. What direction is it facing? Does it hint at someone lost or someone returned?";
      audioUrl = ?"ElevenLabs_Text_to_Speech_audio.mp3";
      sequenceNumber = 1;
      nextLocationHint = "Head to the Halkokari skirmish monument";
      coordinates = {
        latitude = 63.83993;
        longitude = 23.12778;
      };
    };

    let location2 : StoryLocation = {
      id = "location_2";
      title = "Halkokari Skirmish Monument";
      content = "Find the memorial/park marker dedicated to the battle. What year did this clash take place?";
      audioUrl = ?"Location_2_audio.mp3";
      sequenceNumber = 2;
      nextLocationHint = "Continue your journey to the next location";
      coordinates = {
        latitude = 63.859999;
        longitude = 23.118352;
      };
    };

    storyLocations.add(location1.id, location1);
    storyLocations.add(location2.id, location2);
  };

  public query ({ caller }) func getUserProgress() : async UserProgress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can retrieve progress from backend");
    };
    ensureProgressInitialized(caller);
  };

  let storage = Storage.new();
  include MixinStorage(storage);

  public type BackgroundImage = {
    id : Text;
    url : Text;
    description : Text;
  };
};
