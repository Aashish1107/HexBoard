import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Help',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <Suspense>{children}</Suspense>;
}