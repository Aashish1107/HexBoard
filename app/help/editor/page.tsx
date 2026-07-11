"use client";

import { useState } from 'react';
//import { useRouter } from 'next/navigation';
import { Box, Button, HStack, IconButton, List, Separator, Text, VStack, Icon } from '@chakra-ui/react';
import { LuChevronDown, LuChevronUp, LuThumbsDown, LuThumbsUp, LuCircleHelp, LuUserRoundPen } from 'react-icons/lu';
import Link from 'next/link';
import FeedbackDialog from '@/components/FeedbackDialog';


export default function EditHelpPage() {
	const [openSection, setOpenSection] = useState<string | null>(null);
	//const router = useRouter();

	// function goBack() {
	// 	if (window.history.length > 1) {
	// 		router.back();
	// 		return;
	// 	}
	// 	router.push('/help');
	// }

	function toggleSection(section: string) {
		setOpenSection((prev) => (prev === section ? null : section));
	}

	return (
		<Box
			as="main"
			className="editor-help-page"
			minH="100vh"
			px={{ base: 4, md: 8 }}
			py={{ base: 6, md: 10 }}
			bg="radial-gradient(circle at 20% 10%, #ffffff, #f6f4ef)"
			color="#1e1c18"
			fontFamily="Georgia, 'Times New Roman', serif"
		>
			<VStack align="stretch" gap={6} maxW="880px" mx="auto">
				<HStack gap={4} mt={1}>
						<ul className="steps editor-help-actions">
							<li>
								
								<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
									<Link href="/help/"> <Icon size={'lg'} color={'blue'}><LuCircleHelp /></Icon>View the main Help Page</Link>
								</Button>
							</li>
						</ul>
						<ul className="steps editor-help-actions">
							<li>
								<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
									<Link href="/help/home"> View the Home Help Page</Link>
								</Button>
							</li>
						</ul>
						<ul className="steps editor-help-actions">
						<li>
							<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
								<Link href="/help/editor"> <Icon size={'lg'} color={'blue'}><LuUserRoundPen /></Icon>View the Editor Help Page</Link>
							</Button>
						</li>
					</ul>
					</HStack>
				<VStack align="start" gap={2}>
					<h1 style={{ fontSize: '2.5rem', color: '#0f6b5d' }}>
						Terrain Map Editor Guide
					</h1>
					<Text color="#5b554c">Follow each bullet and step-by-step instruction below.</Text>
				</VStack>

				<Separator borderColor="#e3ded4" />

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

                <VStack as="section" align="stretch" gap={4}>
					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('mode-selection')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Mode Selection</Text>
								{openSection === 'mode-selection' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'mode-selection' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									Select the mode you want to use - either adding a terrain, erasing a terrain, or doing nothing
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
                                        <List.Item>Nothing</List.Item>
										<List.Item>Add Mode = to add a terrain</List.Item>
										<List.Item>Erase Mode = to erase a terrain</List.Item>
									</List.Root>
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('adding-terrain')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Adding a Terrain</Text>
								{openSection === 'adding-terrain' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'adding-terrain' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
                                <List.Item>Find the Mode box and select Add Mode</List.Item>
								<List.Item>Click on the box below Choose a terrain</List.Item>
								<List.Item>
									Select the desired terrain
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Open = tan/beige</List.Item>
										<List.Item>Wall = dark gray</List.Item>
										<List.Item>Water = blue</List.Item>
										<List.Item>Glass = light blue</List.Item>
										<List.Item>Shrubbery = dark green</List.Item>
										<List.Item>Curtain = light purple</List.Item>
									</List.Root>
								</List.Item>
								<List.Item>Click on the desired tile to change its terrain</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('erase-terrain')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Erasing a Terrain</Text>
								{openSection === 'erase-terrain' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'erase-terrain' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
                                <List.Item>Find the Mode box and select Erase Mode</List.Item>
								<List.Item>Click on the desired tile turning it white</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('undo-action')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">To Undo an Action - Example: Undo an Erase</Text>
								{openSection === 'undo-action' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'undo-action' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Locate the Undo button at the bottom left</List.Item>
								<List.Item>Click on undo, in this example, the erased tiles are returned</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('redo-action')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">To Redo an Action - Example: Redo an Undo</Text>
								{openSection === 'redo-action' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'redo-action' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Locate the Redo button at the bottom right</List.Item>
								<List.Item>Click on redo, in this example, the undo of the erasing of tiles has been redo&apos;d - the blue tiles are gone now</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('resize-map')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Resizing the Terrain Map</Text>
								{openSection === 'resize-map' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'resize-map' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Click on the box below Choose a size</List.Item>
								<List.Item>Select the desired size</List.Item>
								<List.Item>The lower the number, the small the terrain map becomes - tiles become smaller</List.Item>
								<List.Item>The high the number, the larger the terrain map becomes - tiles become larger</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('zoom-in-out')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Zooming In and Out of the Terrain Map</Text>
								{openSection === 'zoom-in-out' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'zoom-in-out' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Use the scroll wheel on your mouse to zoom in and out</List.Item>
                                <List.Root as="ol" pl={5} gap={2} mt={3}>
								    <List.Item>Scroll up to zoom in</List.Item>
								    <List.Item>Scroll down to zoom out</List.Item>
							    </List.Root>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('move-map')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Moving Around the Terrain Map</Text>
								{openSection === 'move-map' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'move-map' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									Option A - Using the On-Screen Directional Arrow Buttons
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Using any buttons will move the terrain origin based on which arrow-buttons were pressed</List.Item>
									</List.Root>
								</List.Item>
								<List.Item>
									Option B - Using the Mouse and Panning/Dragging
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Using the mouse, left click anywhere within the terrain map area and hold onto the left click</List.Item>
										<List.Item>Move the mouse and the terrain map will move based on where on the terrain map the mouse left clicked on</List.Item>
									</List.Root>
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('save-map')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Saving a Terrain Map</Text>
								{openSection === 'save-map' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'save-map' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Click on Download button</List.Item>
								<List.Item>Find the desired location of saving the file</List.Item>
								<List.Item>Rename the file</List.Item>
								<List.Item>The file will be saved as a .json file</List.Item>
								<List.Item>Look for the notification as a confirmation that the file has been saved</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="#e3ded4" borderRadius="12px" bg="white" p={{ base: 4, md: 5 }} shadow="0 6px 18px rgba(0, 0, 0, 0.05)">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('load-map')}>
							<HStack justify="space-between">
								<Text as="h2" fontSize="1.4rem" color="#0f6b5d">Loading in a Terrain Map</Text>
								{openSection === 'load-map' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'load-map' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Click on the Choose File button</List.Item>
								<List.Item>Locate the .json file - make sure the name matches the files you want</List.Item>
								<List.Item>Select the file and click open</List.Item>
								<List.Item>The text to the left of the Choose File button should match the name of the .json file</List.Item>
								<List.Item>Click the Load button</List.Item>
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
				.editor-help-page h1,
				.editor-help-page h2,
				.editor-help-page .chakra-button,
				.editor-help-page .chakra-badge {
					font-weight: 400 !important;
				}
			`}</style>
		</Box>
	);
}
