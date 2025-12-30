import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, Compass } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 adventure-bg">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-adventure shadow-xl mb-2">
            <Compass className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-black">
            The Mystery of Kokkola
          </h1>
          <p className="text-lg text-black">
            Discover a great hidden story in the city
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-2 border-primary/20 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-black">Welcome, Explorer!</CardTitle>
            <CardDescription className="text-base text-black">
              Log in to start your adventure through Kokkola's hidden stories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-14 text-lg font-semibold bg-gradient-adventure hover:opacity-90 transition-opacity shadow-lg"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-5 w-5" />
                  Login to Start
                </>
              )}
            </Button>

            <div className="text-center text-sm text-black pt-2">
              <p>Secure authentication powered by</p>
              <p className="font-semibold">Internet Identity</p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-2xl">📍</div>
            <p className="text-xs text-black">Scan QR Codes</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🗺️</div>
            <p className="text-xs text-black">Explore Map</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">📖</div>
            <p className="text-xs text-black">Unlock Stories</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-black">
        <p>© 2025. Built with ❤️ using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">caffeine.ai</a></p>
      </footer>
    </div>
  );
}
