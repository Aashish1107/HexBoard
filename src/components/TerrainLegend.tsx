"use client";

import { useId, useState } from 'react';

export type TerrainLegendItem = {
	label: string;
	color: string;
};

export type TerrainLegendProps = {
	buttonLabel?: string;
	title?: string;
	items?: TerrainLegendItem[];
};

export const defaultItems: TerrainLegendItem[] = [
	{ label: 'Open', color: '#f5f5dc' },
	{ label: 'Water', color: '#00ffff' },
	{ label: 'Glass', color: '#e0ffff' },
	{ label: 'Shrubbery', color: '#6b8e23' },
	{ label: 'Curtain', color: '#d8bfd8' },
	{ label: 'Wall', color: '#696969' },
];

export default function TerrainLegend({
	buttonLabel = 'Terrain legend',
	title = 'Terrain legend',
	items = defaultItems,
}: TerrainLegendProps) {
	const [open, setOpen] = useState(false);
	const panelId = useId();

	return (
		<div style={{ position: 'relative', display: 'inline-block' }}>
			<button
				type="button"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((current) => !current)}
				style={{
					border: '1px solid #1f2937',
					borderRadius: 9999,
					background: '#ffffff',
					color: '#111827',
					padding: '0.5rem 0.9rem',
					fontSize: '0.9rem',
					fontWeight: 600,
					cursor: 'pointer',
					boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
				}}
			>
				{open ? 'Hide legend' : buttonLabel}
			</button>

			{open ? (
				<div
					id={panelId}
					role="region"
					aria-label={title}
					style={{
						position: 'absolute',
						top: 'calc(100% + 0.5rem)',
						right: 0,
						zIndex: 20,
						minWidth: '14rem',
						border: '1px solid #d1d5db',
						borderRadius: '0.75rem',
						background: '#ffffff',
						boxShadow: '0 10px 24px rgba(0, 0, 0, 0.15)',
						padding: '0.75rem',
					}}
				>
					<div style={{ marginBottom: '0.6rem', fontWeight: 700, color: '#111827' }}>
						{title}
					</div>
					<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.45rem' }}>
						{items.map((item) => (
							<li key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
								<span
									aria-hidden="true"
									style={{
										width: '1.4rem',
										height: '1.62rem',
										clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
										background: item.color,
										flex: '0 0 auto',
									}}
								/>
								<span style={{ fontSize: '0.92rem', color: '#111827' }}>{item.label}</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
