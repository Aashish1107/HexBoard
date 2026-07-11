'use server';

import { redirect } from 'next/navigation';
import { createSession, verifySession } from './session';
import { cookies } from 'next/headers';
import { VerifyUsernameAndPass } from './VerifyUsernameAndPass';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  // Validate form
  if (!username || !password) {
    return { error: 'Missing credentials' };
  }
  
  // Verify credentials
  const isValid = await VerifyUsernameAndPass(username, password);
  if (!isValid) {
    return { error: 'Invalid credentials' };
  }
  
  // Create session
  await createSession(username);
  redirect('/editor');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/visit');
}

export async function getSession() {
  return await verifySession();
}