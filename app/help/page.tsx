"use client";

import Link from "next/link";
//import { useRouter } from "next/navigation";
import { Button } from "@chakra-ui/react";

export default function HelpPage() {
	// const router = useRouter();

	// function goBack() {
	// 	if (window.history.length > 1) {
	// 		router.back();
	// 		return;
	// 	}
	// 	router.push("/");
	// }

	return (
		<div className="help-page">
			<header className="help-header">
				{/* <Button
					size="sm"
					variant="outline"
					className="top-back-button"
					onClick={goBack}
				>
					Back
				</Button> */}
				<h1>HexBoard User Guide</h1>
				<p>A quick help-guide for navigating and using the HexBoard Application</p>
			</header>

			<main className="help-main">
				<section className="card">
					<h2>Overview</h2>
					<p>
						This guide provides an introduction to the HexBoard web application, including how to navigate between pages and perform common tasks. Whether you&apos;re new to HexBoard or just need a refresher, this guide will help you get started quickly.
					</p>
					{/* <div className="overview-links">
						<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
							<Link href="/">Home</Link>
						</Button>
						<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
							<Link href="/help/editor">Editor</Link>
						</Button>
						<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
							<Link href="/visit">Visit</Link>
						</Button>
					</div> */}
				</section>

				<section className="card">
					<h2>Navigation Basics</h2>
					<ul className="steps">
						<li>
							Use the top navigation or the main buttons on the Home page to jump
							to a feature.
						</li>
						<li>The browser Back button always returns you to the previous page.</li>
						<li>If the page looks empty, scroll down for the main panel.</li>
					</ul>
				</section>

				<section className="card">
					<h2>Common Tasks</h2>
					<h3>Create a new map</h3>
					<ul className="steps">
						<li>Open the Editor.</li>
						<li>Select the create option and name your map.</li>
						<li>Fill in the hexes and save.</li>
					</ul>
					<h3>Open an existing map</h3>
					<ul className="steps">
						<li>Open the Visit page.</li>
						<li>Select the map from the list.</li>
					</ul>
				</section>

				<section className="card">
					<h2>Home Page</h2>
					<p>
						The first page you see is the Home page
						Access an active terrain, create a new one, or edit one you have created.
					</p>
					<ul className="steps editor-help-actions">
						<li>
							<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
								<Link href="/help/home">View the Home Help Page</Link>
							</Button>
						</li>
					</ul>
				</section>

				<section className="card">
					<h2>Editor Page</h2>
					<p>Use the Editor to design custom terrain maps.</p>
					<p className="editor-help-note">
						For a more in-depth guide for the Editor, click the link below.
					</p>
					<ul className="steps editor-help-actions">
						<li>
							<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
								<Link href="/help/editor">View the Editor Help Page</Link>
							</Button>
						</li>
					</ul>
				</section>

				<section className="card">
					<h2>Visit Page</h2>
					<p>Visit an active terrain to explore and interact with by yourself or with others.</p>
					<ul className="steps editor-help-actions">
						<li>
							<Button asChild size="md" bg="#f0ebe2" color="#5b554c" _hover={{ bg: "#e7dfd3", color: "#0f6b5d" }}>
								<Link href="/help/visit">View the Visit Help Page</Link>
							</Button>
						</li>
					</ul>
				</section>

				<section className="card">
					<h2>Troubleshooting</h2>
					<div className="callout">
						<ul className="steps">
							<li>If the page does not load, refresh the browser.</li>
							<li>If a map does not appear, check that it exists in the list.</li>
							<li>
								If changes are not saved, confirm you clicked the save button.
							</li>
						</ul>
					</div>
				</section>
			</main>

			<footer className="help-footer">
				<p>Need more help? Contact your instructor or the project team.</p>
			</footer>

			<style jsx>{`
				.help-page {
					--bg: #f6f4ef;
					--ink: #1e1c18;
					--muted: #5b554c;
					--accent: #0f6b5d;
					--accent-2: #f39c12;
					--card: #ffffff;
					--border: #e3ded4;

					min-height: 100%;
					color: var(--ink);
					font-family: Georgia, 'Times New Roman', serif;
					background: radial-gradient(circle at 20% 10%, #ffffff, var(--bg));
					line-height: 1.6;
				}

				.help-page * {
					box-sizing: border-box;
				}

				.help-header {
					position: relative;
					padding: 48px 24px 24px;
					background: linear-gradient(120deg, #fff, #f2efe8);
					border-bottom: 1px solid var(--border);
					text-align: center;
				}

				.top-back-button {
					position: absolute;
					top: 16px;
					left: 16px;
				}

				.help-header h1 {
					margin: 0 0 8px;
					font-size: 2.2rem;
					letter-spacing: 0.5px;
				}

				.help-header p {
					margin: 0;
					color: var(--muted);
				}

				.help-main {
					max-width: 880px;
					margin: 0 auto;
					padding: 24px;
				}

				.card {
					background: var(--card);
					border: 1px solid var(--border);
					border-radius: 12px;
					padding: 20px;
					margin-bottom: 16px;
					box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
				}

				h2 {
					margin-top: 0;
					font-size: 1.4rem;
					color: var(--accent);
				}

				h3 {
					margin-bottom: 6px;
					font-size: 1.1rem;
				}

				ul {
					padding-left: 20px;
					margin: 8px 0;
				}

				.overview-links {
					display: flex;
					gap: 8px;
					flex-wrap: wrap;
				}

				.steps li {
					margin-bottom: 6px;
				}

				.callout {
					border-left: 4px solid var(--accent-2);
					padding: 12px 16px;
					background: #fff8e6;
					border-radius: 8px;
					color: #6b4c00;
				}

				.editor-help-note {
					margin-bottom: 14px;
				}

				.editor-help-actions {
					margin-top: 0;
				}

				.help-footer {
					padding: 16px 24px 40px;
					text-align: center;
					color: var(--muted);
				}

				@media (max-width: 600px) {
					.top-back-button {
						top: 12px;
						left: 12px;
					}

					.help-header {
						padding: 32px 16px 16px;
					}

					.help-main {
						padding: 16px;
					}
				}
			`}</style>
		</div>
	);
}
