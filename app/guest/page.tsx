'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button, Field, Input, Text, VStack } from '@chakra-ui/react';

function makeGuestId() {
  return `guest-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Page() {
  const router = useRouter();
  const [id, setID] = useState('');
  const [guestId] = useState(makeGuestId);

  const canEnter = useMemo(() => id.length === 21 && encodeURIComponent(id) === id, [id]);

  function enterAsGuest() {
    if (!canEnter) return;
    router.push(`/visit?id=${id}&user=${guestId}`);
  }

  return (
    <VStack>
      <Text fontSize="3xl">Guest Access</Text>
      <Text fontSize="sm">No login required. Enter a map ID to join.</Text>
      <Field.Root w="400px">
        <Field.Label>Meeting Space ID</Field.Label>
        <Input value={id} onChange={(event) => setID(event.target.value)} placeholder="21-character ID" />
        <Field.HelperText>Enter the meeting space ID provided by the host.</Field.HelperText>
      </Field.Root>
      <Button onClick={enterAsGuest} disabled={!canEnter}>
        Enter as Guest
      </Button>
      <Button variant="outline" size="sm">
        <Link href="/UserAccountCreation">Back</Link>
      </Button>
    </VStack>
  );
}
