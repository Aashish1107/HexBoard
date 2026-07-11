'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Field, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { LightDarkToggleButton } from '@/components/LightDarkToggleButton';

export default function Page() {
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const passwordsMatch = password !== '' && password === verifyPassword;
  const showPasswordMismatch = verifyPassword !== '' && password !== verifyPassword;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <VStack>
      <HStack w="400px" justify="space-between" align="center">
        <Text fontSize="3xl">Create Account</Text>
        <LightDarkToggleButton />
      </HStack>
      <Field.Root w="400px">
        <Field.Label>Display Name</Field.Label>
        <Input type="text" value={displayName} placeholder="" onChange={(e) => setDisplayName(e.target.value)} />
        <Field.HelperText>Enter the name you want other users to see.</Field.HelperText>
      </Field.Root>
      <Field.Root w="400px">
        <Field.Label>Password</Field.Label>
        <Input type="password" value={password} placeholder="" onChange={(e) => setPassword(e.target.value)} />
        <Field.HelperText>Front-end only field for now.</Field.HelperText>
      </Field.Root>
      <Field.Root w="400px">
        <Field.Label>Verify Password</Field.Label>
        <Input type="password" value={verifyPassword} placeholder="" onChange={(e) => setVerifyPassword(e.target.value)} />
        <Field.HelperText color={showPasswordMismatch ? 'red.500' : undefined}>
          {showPasswordMismatch ? 'Passwords must match.' : 'Front-end only field for now.'}
        </Field.HelperText>
      </Field.Root>
      <HStack w="400px">
        <Field.Root>
          <Field.Label>Image URL</Field.Label>
          <Input type="url" value={avatarUrl} placeholder="" onChange={(e) => setAvatarUrl(e.target.value)} />
          <Field.HelperText>Enter a URL to an image.</Field.HelperText>
        </Field.Root>
        <Avatar.Root>
          <Avatar.Image src={avatarUrl || undefined} />
          <Avatar.Fallback name={displayName || 'Anonymous User'} />
        </Avatar.Root>
      </HStack>
      <Button
        variant="outline"
        size="sm"
        disabled={!passwordsMatch || displayName.trim() === '' || creating}
        onClick={async () => {
          setError(null);
          setCreating(true);
          try {
            const name = displayName.trim();
            const pass = password.trim();
            // Create user
            const res = await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, avatar: avatarUrl, password: pass })
            });
            if (!res.ok) throw new Error(await res.text());

            // Log in to create session cookie
            const authRes = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name, password: pass })
            });
            if (!authRes.ok) throw new Error(await authRes.text());

            // Redirect to main page after account creation
            router.push('/');
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setCreating(false);
          }
        }}
      >
        {creating ? 'Creating...' : 'Create account'}
      </Button>
      {error ? <Text color="red.500">{error}</Text> : null}
      <Button variant="outline" size="sm">
        <Link href="/guest">Continue as Guest</Link>
      </Button>
      <Button variant="outline" size="sm">
        <Link href="/">Back to home</Link>
      </Button>
    </VStack>
  );
}