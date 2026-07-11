import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Home Guide',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <Suspense>{children}</Suspense>;
}