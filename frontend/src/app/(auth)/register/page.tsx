'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const rules = [
  { id: 'length',  label: 'At least 8 characters',         test: (p: string) => p.length >= 8 },
  { id: 'upper',   label: 'At least one uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least one lowercase letter',  test: (p: string) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number',            test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least one special character', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const ruleResults = useMemo(() =>
    rules.map(rule => ({ ...rule, passed: rule.test(password) })),
    [password]
  );

  const allRulesPassed = ruleResults.every(r => r.passed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Threat Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered threat analysis and detection</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Create account</CardTitle>
            <CardDescription className="text-gray-400">
              Sign up to start analyzing your logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950 border-red-800">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                {/* Live password rules */}
                {(passwordFocused || password.length > 0) && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg space-y-2">
                    <p className="text-gray-400 text-xs font-medium">Password must:</p>
                    {ruleResults.map(rule => (
                      <div key={rule.id} className="flex items-center gap-2">
                        {rule.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={`text-xs ${rule.passed ? 'text-green-400' : 'text-gray-500'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-gray-300">
                  Confirm password <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 ${
                    confirm.length > 0 && confirm !== password ? 'border-red-500' : ''
                  }`}
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !allRulesPassed || password !== confirm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}