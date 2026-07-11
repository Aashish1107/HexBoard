'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // new!
import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, CloseButton, Dialog, Field, HStack, Icon, Input, Portal, Separator, Text, VStack } from '@chakra-ui/react';
import { LuCircleHelp } from 'react-icons/lu';
import { TerrainMap } from '@/src/TerrainMap';
import { Toaster, toaster } from '@/components/ui/toaster';
import { LightDarkToggleButton } from '@/components/LightDarkToggleButton';

export default function Page() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState('');
    const [entering, setEntering] = useState(false);
    const router = useRouter();
    const [id, setID] = useState('');
    const [IDvalid, setIDvalid] = useState('');
    const [editKey, setEditKey] = useState('');
    const [editKeyLoading, setEditKeyLoading] = useState(false);
    useEffect(() => {
        async function checkID() {
            if (id.length !== 21 || encodeURIComponent(id) !== id) {
               return;
            }
            const response = await fetch(`/api/map/${id}`, {
                method: 'GET',
            });
            if (response.ok) {
                setIDvalid(id);
            } else {
                toaster.create({
                    title: 'ID Error',
                    description: `ID not available on server: ${id}`,
                    type: 'error',
                });
            }
        }
        checkID();
    }, [id]);
 
    const genNewBoard = useCallback(async () => {
        setEditKeyLoading(true);
        try {
            const response = await fetch('/api/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(new TerrainMap()),
            });
            console.log('got response', response);
            if (response.ok) {
                const { id, editKey } = await response.json();
                setID(id);
                setEditKey(editKey);
                setEditKeyLoading(false);
            } else {
                const error = await response.text();
                console.log('error', response.status, error);
                setID('');
                setEditKey('');
                setEditKeyLoading(false);
                toaster.create({
                    title: 'Error',
                    description: `Failed to create new board: ${error}`,
                    type: 'error',
                });
            }
        } catch (error) {
            console.log('error', error);
        }
    }, []);
    const deleteMap = useCallback(async (id:string,editKey:string) => {
        if (editKey === '') return;
        try {
            await fetch(`/api/map/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${editKey}`,
                },
            });
            setID('');
            setEditKey('');
        } catch (error) {
            console.log('ignored delete error', error);
        }
    },[]);
    const enterSpace = useCallback(async () => {
        if (IDvalid !== id) {
            toaster.create({
                title: 'ID Error',
                description: `ID not available on server: ${id}`,
                type: 'error',
            });
            return;
        }
        if (id === '') {
            toaster.create({
                title: 'ID Error',
                description: `ID not defined: ${id}`,
                type: 'error',
            });
            return;
        }
        setEntering(true);
        const loginName = name.trim();
        const loginPassword = password.trim();
        if (loginName === '' || loginPassword === '') {
            toaster.create({
                title: 'Error',
                description: 'Name and password are required to log in.',
                type: 'error',
            });
            setEntering(false);
            return;
        }

        const response = await fetch(`/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ name: loginName, password: loginPassword }),
        });
        if (!response.ok) {
            let description = `Failed to log in: ${response.status}`;
            try {
                const err = await response.json();
                if (err?.error) description = err.error;
            } catch {
                // Keep default message when body is not JSON.
            }
            toaster.create({
                title: 'Error',
                description,
                type: 'error',
            });
            setEntering(false);
            return;
        }
        const { id: userID } = await response.json();
        setEntering(false);
        router.push('visit?id='+id+'&user='+userID);
    }, [router, id, IDvalid, name, password]);
    return (
        <VStack>
            <HStack w="400px" justify="space-between" align="center">
                <Text fontSize="3xl">HexBoard</Text>
                <LightDarkToggleButton />
            </HStack>
            <Field.Root w="400px">
                <Field.Label>
                Name
                </Field.Label>
                <Input type="text" value={name} placeholder="" onChange={(e) => setName(e.target.value)}/>
                <Field.HelperText>Enter your name.</Field.HelperText>
            </Field.Root>
            <Field.Root w="400px">
                <Field.Label>
                Password
                </Field.Label>
                <Input type="password" value={password} placeholder="" onChange={(e) => setPassword(e.target.value)}/>
                <Field.HelperText>Enter your password.</Field.HelperText>
            </Field.Root>
            <HStack w="400px">
                <Field.Root>
                    <Field.Label>Image URL</Field.Label>
                    <Input type="url" value={avatar} placeholder="" onChange={(e) => setAvatar(e.target.value)}/>
                    <Field.HelperText>Enter a URL to an image.</Field.HelperText>
                </Field.Root>
                <Avatar.Root>
                    <Avatar.Image src={avatar||undefined} />
                    <Avatar.Fallback name={name||"Anonymous User"} />
               </Avatar.Root>
            </HStack>
            <Field.Root w="400px">
                <Field.Label>
                Meeting Space ID
                </Field.Label>
                <Input type="text" value={id} placeholder="" onChange={(e) => setID(e.target.value)}/>
                <Field.HelperText>This is the 21 character string provided by the host.</Field.HelperText>
            </Field.Root>
            <HStack>
                <Button variant="outline" size="sm" disabled={IDvalid !== id || id === '' || entering} onClick={enterSpace}>
                    Enter Meeting Space
                </Button>
                <Button variant="outline" size="sm" disabled={IDvalid!==id || id === ''}>
                    <Link href={"editor?id="+id}>Edit</Link>
                </Button>
            </HStack>
            <Separator w="400px"/>
            <Dialog.Root>
                <Dialog.Trigger asChild>
                    <Button variant="outline" size="sm" onClick={genNewBoard}>
                    Edit a New Meeting Space
                    </Button>
                </Dialog.Trigger>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Creating a New Board</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                            { (editKeyLoading)
                            ? <Text>Please wait while an edit key is generated.</Text> 
                            : (editKey === '') 
                            ? <Text>Failed to create a new board. You can proceed
                                but your board can only be downloaded to your 
                                local computer. It cannot be saved on the server.
                            </Text> 
                            : <VStack>
                                <>ID: {id}</><br/>
                                <>Edit Key: {editKey}</>
                                <p>
                                Please copy down both the ID and the Edit Key.
                                The ID will be needed by anyone entering 
                                meeting space.  The edit key will be needed by you 
                                whenever you edit the space.  Once you click the button,
                                you will not be able to retrieve it again.
                                </p>
                                </VStack> }
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => deleteMap(id,editKey)}>Cancel</Button>
                                </Dialog.ActionTrigger>
                                <Button loading={editKeyLoading} asChild>
                                    <Link href={"editor?id="+id}>Edit</Link>
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" onClick={() => { deleteMap(id,editKey)}}/>
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
            <Button variant="outline" size="sm">
                <Link href="/UserAccountCreation">New User</Link>
            </Button>
            <Button variant="outline" size="sm">
                <Link href="editor">Edit a Local Meeting Space</Link>
            </Button>
            <Button variant="outline" size="lg">
                <Link href="/help" target="_blank" rel="noopener noreferrer">
                    <Icon size={'lg'} color={'blue'}><LuCircleHelp /></Icon> Help
                </Link>
            </Button>
            <Toaster/>
            </VStack>
        );
    }