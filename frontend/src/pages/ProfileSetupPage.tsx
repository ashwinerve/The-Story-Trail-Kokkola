import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSetupPageProps {
  onComplete: () => void;
}

export default function ProfileSetupPage({ onComplete }: ProfileSetupPageProps) {
  const [name, setName] = useState('');
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    saveProfile(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success('Profile created successfully!');
          onComplete();
        },
        onError: (error) => {
          console.error('Failed to save profile:', error);
          toast.error('Failed to create profile. Please try again.');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 adventure-bg">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-adventure shadow-xl mb-2">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#000000' }}>
            Welcome, Explorer!
          </h1>
          <p style={{ color: '#000000' }}>
            Let's set up your profile to begin your adventure
          </p>
        </div>

        {/* Profile Setup Card */}
        <Card className="border-2 border-primary/20 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl" style={{ color: '#000000' }}>Create Your Profile</CardTitle>
            <CardDescription style={{ color: '#000000' }}>
              Enter your name to personalize your story trail experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base" style={{ color: '#000000' }}>
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  className="h-12 text-base"
                  maxLength={50}
                  autoFocus
                />
                <p className="text-xs" style={{ color: '#000000' }}>
                  This name will be used throughout your adventure
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full h-12 text-base font-semibold bg-gradient-adventure hover:opacity-90 transition-opacity shadow-lg"
                style={{ color: '#000000' }}
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Profile...
                  </>
                ) : (
                  'Start Adventure'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm" style={{ color: '#000000' }}>
          You can update your profile later from the settings menu
        </p>
      </div>
    </div>
  );
}
