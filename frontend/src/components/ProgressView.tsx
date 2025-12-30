import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Trophy } from 'lucide-react';
import type { UserProgress } from '../backend';

interface ProgressViewProps {
  userProgress: UserProgress | null | undefined;
  onBack: () => void;
}

export default function ProgressView({ userProgress, onBack }: ProgressViewProps) {
  const completedCount = userProgress?.completedLocations.length || 0;
  const totalLocations = Number(userProgress?.totalLocations || 3);
  const progressPercentage = (completedCount / totalLocations) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Main Content - Compact layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-3 space-y-3 max-w-2xl pb-2">
          {/* Overall Progress Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-lg">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: '#FFFFFF' }}>
                <Trophy className="h-5 w-5 text-yellow-500" />
                Your Progress
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: '#FFFFFF' }}>
                Track your adventure through Kokkola
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                  Locations Discovered
                </span>
                <span className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                  {completedCount} / {totalLocations}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-center" style={{ color: '#FFFFFF' }}>
                {progressPercentage === 100 
                  ? '🎉 Congratulations! You completed the story trail!' 
                  : `${Math.round(progressPercentage)}% complete - Keep exploring!`}
              </p>
            </CardContent>
          </Card>

          {/* Completion Stats Card */}
          <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-2 pt-3 px-4">
              <CardTitle className="text-base" style={{ color: '#FFFFFF' }}>Completion Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 px-4 pb-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-muted-foreground mb-1" style={{ color: '#FFFFFF' }}>Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-muted-foreground mb-1" style={{ color: '#FFFFFF' }}>Remaining</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalLocations - completedCount}</p>
                </div>
              </div>
              
              {progressPercentage === 100 && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-900/20 p-4 rounded-lg border-2 border-yellow-300 dark:border-yellow-700 text-center">
                  <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-1">🏆 Achievement Unlocked!</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">Story Trail Master</p>
                </div>
              )}
              
              {progressPercentage > 0 && progressPercentage < 100 && (
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-3 rounded-lg border border-primary/20 text-center">
                  <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {totalLocations - completedCount === 1 
                      ? 'Just one more location to go!' 
                      : `${totalLocations - completedCount} more locations to discover!`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Back Button */}
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

