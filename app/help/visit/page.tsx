"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Box, Button, Heading, HStack, List, Separator, Text, VStack, Icon } from '@chakra-ui/react';
import { LuChevronDown, LuChevronUp, LuCircleHelp, LuUserRoundPen } from 'react-icons/lu';
import FeedbackDialog from '@/components/FeedbackDialog';
//import { Icon } from 'node_modules/@chakra-ui/react/dist/types/components/blockquote/namespace';


export default function VisitHelpPage() {
	const [openSection, setOpenSection] = useState<string | null>(null);

	function toggleSection(section: string) {
		setOpenSection((prev) => (prev === section ? null : section));
	}

	return (
		<Box
			as="main"
			minH="100vh"
			px={{ base: 4, md: 8 }}
			py={{ base: 6, md: 10 }}
			bgGradient="linear(to-b, blue.50, cyan.50)"
		>
			<VStack align="stretch" gap={6} maxW="900px" mx="auto">
				<VStack align="start" gap={2}>
					<Badge colorPalette="blue" variant="solid">HexBoard Help</Badge>
					<Heading size={{ base: 'xl', md: '2xl' }}>HexWorld Visit Guide</Heading>
					<Text color="fg.muted">Follow each bullet and step-by-step instruction below.</Text>
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
				</VStack>

				<Separator />

				<VStack as="section" align="stretch" gap={4}>
					<Box borderWidth="1px" borderColor="blue.200" borderRadius="xl" bg="white" p={{ base: 4, md: 5 }} shadow="sm">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('move-around')}>
							<HStack justify="space-between">
								<Text as="h2" fontWeight="bold" fontSize="lg">How to move around the Hexworld</Text>
								{openSection === 'move-around' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'move-around' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>
									Option A - Using the On-Screen Directional Arrow Buttons
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Click any directional arrow button to move your character in that direction</List.Item>
									</List.Root>
								</List.Item>
								<List.Item>
									Option B - Using Keyboard numeric Keys
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Click on the numeric keypad arrow keys to move your character</List.Item>
									</List.Root>
								</List.Item>
								<List.Item>
									Option C - Using Context Menu
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Right click on a tile to open the context menu, select move here</List.Item>
									</List.Root>
								</List.Item>
							</List.Root>
						)}
					</Box>

					<Box borderWidth="1px" borderColor="blue.200" borderRadius="xl" bg="white" p={{ base: 4, md: 5 }} shadow="sm">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('cannot-move')}>
							<HStack justify="space-between">
								<Text as="h2" fontWeight="bold" fontSize="lg">Why I cannot move to some places</Text>
								{openSection === 'cannot-move' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'cannot-move' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Some tiles have terrain types that block movement</List.Item>
								<List.Item>
									The following terrain types are impassable:
									<List.Root as="ol" listStyleType="lower-alpha" pl={5} mt={2} gap={1}>
										<List.Item>Wall = dark gray tiles cannot be entered</List.Item>
										<List.Item>Water = blue tiles are not traversable on foot</List.Item>
										<List.Item>Glass = light blue tiles are transparent and cannot be entered</List.Item>
										<List.Item>Shrubbery = dark green tiles are dense and cannot be entered	</List.Item>
										<List.Item>Curtain = light purple tiles are opaque and cannot be entered</List.Item>

									</List.Root>
								</List.Item>
								<List.Item>The tile is already occupied by another character or object</List.Item>
							</List.Root>
						)}
					</Box>
					<Box borderWidth="1px" borderColor="blue.200" borderRadius="xl" bg="white" p={{ base: 4, md: 5 }} shadow="sm">
						<Box as="button" w="full" textAlign="left" onClick={() => toggleSection('chat-with-users')}>
							<HStack justify="space-between">
								<Text as="h2" fontWeight="bold" fontSize="lg">How to chat with the other users</Text>
								{openSection === 'chat-with-users' ? <LuChevronUp /> : <LuChevronDown />}
							</HStack>
						</Box>
						{openSection === 'chat-with-users' && (
							<List.Root as="ol" pl={5} gap={2} mt={3}>
								<List.Item>Right click on a user&apos;s avatar to open the context menu and select &quot;Send Message&quot;</List.Item>
								<List.Item>Type your message in the chat input and press Enter to send</List.Item>

							</List.Root>
						)}
					</Box>
				</VStack>

				<Separator />

				<FeedbackDialog />
			</VStack>
		</Box>
	);
}
