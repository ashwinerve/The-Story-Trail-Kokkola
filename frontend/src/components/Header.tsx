import { Button } from './ui/button';
import { MapPin, LogOut, TrendingUp, Camera } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';

interface HeaderProps {
  userName: string;
  onLogout: () => void;
  onViewProgress: () => void;
  onOpenScanner: () => void;
  currentView: 'map' | 'scanner' | 'story' | 'progress';
}

export default function Header({ 
  userName, 
  onLogout, 
  onViewProgress, 
  onOpenScanner, 
  currentView
}: HeaderProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-3 py-3 flex items-center justify-between max-w-full">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-adventure flex items-center justify-center shadow-md">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Story Trail</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Kokkola Adventure</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentView !== 'scanner' && (
            <Button
              onClick={onOpenScanner}
              variant="outline"
              size="sm"
              className="h-10 px-3"
            >
              <Camera className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-adventure text-white font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">Explorer</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {currentView !== 'progress' && (
                <DropdownMenuItem onClick={onViewProgress}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Progress
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
