"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, HStack, IconButton, List, Separator, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown, LuChevronUp, LuThumbsDown, LuThumbsUp } from 'react-icons/lu';
import FeedbackDialog from '@/components/FeedbackDialog';


export default function HomeHelpPage() {
	const [openSection, setOpenSection] = useState<string | null>(null);
	const router = useRouter();

	function goBack() {
		if (window.history.length > 1) {
			router.back();
			return;
		}
		router.push('/help-guides');
	}

	function toggleSection(section: string) {
		setOpenSection((prev) => (prev === section ? null : section));
	}

	return (
		<Box
			as="main"
			className="home-help-page"
			minH="100vh"
			px={{ base: 4, md: 8 }}
			py={{ base: 6, md: 10 }}
			bg="radial-gradient(circle at 20% 10%, #ffffff, #f6f4ef)"
			color="#1e1c18"
			fontFamily="Georgia, 'Times New Roman', serif"
		>
			<VStack align="stretch" gap={6} maxW="880px" mx="auto">
				<HStack justify="flex-start">
					<Button size="sm" variant="outline" onClick={goBack}>
						Back
					</Button>
				</HStack>
				<VStack align="start" gap={2}>
					<h1 style={{ fontSize: '2.5rem', color: '#0f6b5d' }}>
						HexBoard Set Up Instructions
					</h1>
					<Text color="#5b554c">A tutorial for configuring your name, avatar, and space ID.</Text>
				</VStack>

				<Separator borderColor="#e3ded4" />

                <VStack as="section" align="stretch" gap={4}>
					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('about-page')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">About This Page</Text>
								{openSection === 'about-page' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'about-page' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									WHO: New users joining a HexBoard meeting space
								</List.Item>
								<List.Item>
									WHAT: A tutorial for configuring your name, avatar, and space ID
								</List.Item>
								<List.Item>
									WHY: To ensure you are correctly identified by others in the virtual world
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('username-setup')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Username Setup</Text>
								{openSection === 'username-setup' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'username-setup' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									Choose a unique name to be displayed to other users when they interact with your avatar
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
                                        <List.Item>You will not be able to change the name during the session</List.Item>
									</List.Root>
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('avatar-image')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Avatar Image</Text>
								{openSection === 'avatar-image' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'avatar-image' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
                                <List.Item>Locate the box below Image URL</List.Item>
								<List.Item>Paste a web link (URL) to an image</List.Item>
								<List.Item>
									You will see a circular preview (like the &quot;AU&quot; icon) update to show your image
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('meeting-space-id')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Meeting Space ID</Text>
								{openSection === 'meeting-space-id' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'meeting-space-id' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Locate the box below Meeting Space ID</List.Item>
								<List.Item>
									Paste the unique 21-character string provided by the room host
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('join-environment')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Join the Environment</Text>
								{openSection === 'join-environment' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'join-environment' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Click the Enter Meeting Space button</List.Item>
								<List.Item>You will be transported to the hexagonal map</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('create-edit-maps')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Create or Edit Maps</Text>
								{openSection === 'create-edit-maps' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'create-edit-maps' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									If you want to build a new map from scratch, click Edit a New Meeting Space
								</List.Item>
								<List.Item>
									To modify an existing map saved on your computer, click Edit a Local Meeting Space
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('light-dark-mode')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Light/Dark Mode</Text>
								{openSection === 'light-dark-mode' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'light-dark-mode' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									Use the toggle button to switch light and dark mode themes
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('back-nav')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Navigating Back to Help</Text>
								{openSection === 'back-nav' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'back-nav' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Locate the Back button and select it
                                     <List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
                                         <List.Item>This will take you back to the main Help page</List.Item>
								</List.Root>
                                 </List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Text as="h2" fontSize="1.4rem" color="#0f6b5d" mb={2}> 
							Feedback
						</Text>
                        <HStack align="center">
							<Text>
                                Was this information helpful?
							</Text>
							<IconButton aria-label="thumbs up" size="sm" variant="outline">
								<LuThumbsUp />
							</IconButton>
							<IconButton aria-label="thumbs down" size="sm" variant="outline">
								<LuThumbsDown />
							</IconButton>
						</HStack>
                        <Text>
                            
						</Text>
						<Text> 
							Didn&apos;t find what you were looking for? Leave a message via the button below!
						</Text>

                        <Text>
                            
						</Text>

						<FeedbackDialog />

					</Box>
				</VStack>
			</VStack>
			<style jsx global>{`
				.home-help-page h1,
				.home-help-page h2,
				.home-help-page .chakra-button,
				.home-help-page .chakra-badge {
					font-weight: 400 !important;
				}
			`}</style>
		</Box>
	);
}
