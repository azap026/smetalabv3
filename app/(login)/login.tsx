'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const emailParam = searchParams.get('email');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CircleIcon className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-3xl font-extrabold">
            {mode === 'signin'
              ? 'Sign in to your account'
              : 'Create your account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'New to our platform?'
              : 'Already have an account?'}{' '}
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}?${new URLSearchParams({
                ...(redirect ? { redirect } : {}),
                ...(priceId ? { priceId } : {}),
                ...(inviteId ? { inviteId } : {}),
                ...(emailParam ? { email: emailParam } : {}),
              }).toString()}`}
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state?.email || emailParam || ''}
                readOnly={!!inviteId && mode === 'signup'}
                required
                maxLength={50}
                placeholder="Enter your email"
                className={`${!!inviteId && mode === 'signup'
                  ? 'bg-gray-100 cursor-not-allowed'
                  : ''
                  }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state?.password}
                required
                minLength={8}
                maxLength={100}
                placeholder="Enter your password"
              />
            </div>

            {mode === 'signup' && !inviteId && (
              <div className="space-y-2">
                <Label htmlFor="organizationName">Название организации</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required={!inviteId}
                  maxLength={100}
                  placeholder="ООО Smetalab"
                />
              </div>
            )}

            {state?.error && (
              <div className="text-red-500 text-sm">{state?.error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

