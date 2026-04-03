import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { createUser, verifyUser } from '../lib/auth';

interface AuthModalProps {
  open: boolean;
  onSignIn: (username: string) => void;
  onSignUp: (username: string) => void;
  onClose: () => void;
}

export default function AuthModal({ open, onSignIn, onSignUp, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');

  if (!open) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    if (!signInUsername || !signInPassword) {
      setSignInError('Please fill in all fields.');
      return;
    }
    const ok = await verifyUser(signInUsername, signInPassword);
    if (!ok) {
      setSignInError('Invalid username or password.');
      return;
    }
    onSignIn(signInUsername);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    const result = await createUser(signUpUsername, signUpPassword);
    if (!result.success) {
      setSignUpError(result.error);
      return;
    }
    onSignUp(signUpUsername);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/80 backdrop-blur-sm">
      <div className="w-[800px] bg-amber-50 border-2 border-amber-400 rounded-2xl shadow-2xl p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-amber-400 hover:text-amber-700 text-xl font-bold"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl mb-1 text-amber-900">🏴‍☠️ Treasure Hunt</h1>
          <p className="text-amber-700 text-sm">Sign in to save your scores!</p>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'signin' | 'signup')}>
          <TabsList className="w-full mb-4 bg-amber-200">
            <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="flex flex-col gap-3">
              <div>
                <Label htmlFor="signin-username" className="text-amber-900">Username</Label>
                <Input
                  id="signin-username"
                  placeholder="Your username"
                  value={signInUsername}
                  onChange={e => setSignInUsername(e.target.value)}
                  className="mt-1 border-amber-300 focus-visible:ring-amber-400"
                />
              </div>
              <div>
                <Label htmlFor="signin-password" className="text-amber-900">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Your password"
                  value={signInPassword}
                  onChange={e => setSignInPassword(e.target.value)}
                  className="mt-1 border-amber-300 focus-visible:ring-amber-400"
                />
              </div>
              {signInError && (
                <p className="text-red-600 text-sm">{signInError}</p>
              )}
              <Button type="submit" className="mt-1 bg-amber-600 hover:bg-amber-700 text-white">
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <div>
                <Label htmlFor="signup-username" className="text-amber-900">Username</Label>
                <Input
                  id="signup-username"
                  placeholder="3–20 chars, letters/numbers/_"
                  value={signUpUsername}
                  onChange={e => setSignUpUsername(e.target.value)}
                  className="mt-1 border-amber-300 focus-visible:ring-amber-400"
                />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-amber-900">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 4 characters"
                  value={signUpPassword}
                  onChange={e => setSignUpPassword(e.target.value)}
                  className="mt-1 border-amber-300 focus-visible:ring-amber-400"
                />
              </div>
              {signUpError && (
                <p className="text-red-600 text-sm">{signUpError}</p>
              )}
              <Button type="submit" className="mt-1 bg-amber-600 hover:bg-amber-700 text-white">
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
