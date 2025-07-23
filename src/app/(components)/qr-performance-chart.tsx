'use client';

import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis } from 'recharts';
import { QrOrder } from '@/types/types';

interface QrPerformanceChartProps {
	qrOrders: QrOrder[];
	id?: string;
}

export function QrPerformanceChart({ qrOrders, id }: QrPerformanceChartProps) {
	const dailyStats = qrOrders.reduce((acc: any, order: QrOrder) => {
		const date = new Date(order.created_at).toISOString().split('T')[0]; // Get YYYY-MM-DD
		
		if (!acc[date]) {
		  acc[date] = {
			date,
			orders: 0,
			revenue: 0
		  };
		}
		
		acc[date].orders += 1;
		acc[date].revenue += order.total_amount;
		
		return acc;
	  }, {});
	  
	  // Convert to array sorted by date
	  const chartData = Object.values(dailyStats).sort((a: any, b: any) => 
		new Date(b.date).getTime() - new Date(a.date).getTime()
	  );


	return (
		<div
			className='h-full'
			id={id || 'qr-performance-chart-container'}>
			<ChartContainer
				config={{}}
				className='aspect-[none] h-full'>
				<LineChart
					data={chartData}
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
						dataKey='date'
						tickFormatter={(value) => {
							const date = new Date(value);
							return date.toLocaleDateString('es-ES', {
								day: '2-digit',
								month: '2-digit',
							});
						}}
						axisLine={false}
						tickLine={false}
					/>

					<Line
						type='monotone'
						dataKey='orders'
						name='Pedidos'
						stroke='hsl(var(--chart-1))'
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 6 }}
					/>

					<Line
						type='monotone'
						dataKey='revenue'
						name='Ingresos ($)'
						stroke='hsl(var(--chart-2))'
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ChartContainer>
		</div>
	);
}
