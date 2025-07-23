'use client';

import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';

interface QrComparisonChartProps {
	qrId: string;
	id?: string;
}

export function QrComparisonChart({ qrId, id }: QrComparisonChartProps) {
	// Mock data for QR comparison
	const generateComparisonData = () => {
		// Generate data based on the QR ID to ensure consistency
		const seed = qrId.charCodeAt(qrId.length - 1);

		// Base QR locations
		const locations = ['Mesa 5', 'Mesa 12', 'Entrada Principal', 'Cartel Publicitario', 'Mesa 8'];

		// Filter out the current QR (assuming its name is in the locations array)
		const currentQrName = locations.find((loc) => loc.toLowerCase().includes(qrId.toLowerCase().replace('qr00', 'mesa '))) || locations[0];

		// Generate comparison data
		return locations.map((location, index) => {
			const isCurrent = location === currentQrName;
			const modifier = ((seed + index) % 5) + 1; // 1-5
			const baseOrders = 80 + modifier * 20;
			const baseRevenue = baseOrders * (15 + modifier * 3);

			return {
				name: location,
				orders: baseOrders + (isCurrent ? 30 : 0), // Current QR has more orders
				revenue: baseRevenue + (isCurrent ? 500 : 0), // Current QR has more revenue
				isCurrent,
			};
		});
	};

	const comparisonData = generateComparisonData();

	return (
		<div
			className='h-full'
			id={id || 'qr-comparison-chart-container'}>
			<ChartContainer
				config={{}}
				className='aspect-[none] h-full'>
				<BarChart
					data={comparisonData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 5,
					}}>
					<ChartTooltip content={<ChartTooltipContent />} />

					<CartesianGrid
						strokeDasharray='3 3'
						vertical={false}
					/>

					<XAxis
						dataKey='name'
						axisLine={false}
						tickLine={false}
					/>

					<Bar
						dataKey='orders'
						name='Pedidos'
						fill='hsl(var(--chart-1))'
						radius={4}
						barSize={30}
					/>

					<Bar
						dataKey='revenue'
						name='Ingresos ($)'
						fill='hsl(var(--chart-2))'
						radius={4}
						barSize={30}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
