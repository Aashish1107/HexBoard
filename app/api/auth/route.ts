import { NextRequest, NextResponse } from 'next/server';
import { VerifyUsernameAndPass } from '@/lib/VerifyUsernameAndPass';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    //check if body has username and password
    if (!body || !body.name || !body.password) {
        return NextResponse.json(
            { error: 'Missing credentials' },
            { status: 401 }
        );
    }
    const { name, password } = body;
    
    if (!name || !password) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 401 }
      );
    }
    
    const isValid = await VerifyUsernameAndPass(name, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (typeof isValid === 'object' && 'status' in isValid && isValid.status !== 200) {
        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
        );
    }
    const userData = await (isValid as Response).json();
    const userID = userData.id;
    await createSession(userID);
    
    return NextResponse.json({ success: true, id: userID });
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  //implement session verification logic here
  return NextResponse.json(
    { error: 'Not implemented' }, 
    { status: 501 }
    );
}

export async function DELETE(_request: NextRequest) {
  //implement session deletion logic here
  return NextResponse.json(
    {error: "Not implemented"},
    { status: 501 }
  );
}