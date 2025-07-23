'use client';

import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis } from 'recharts';

interface SalesAnalysisChartProps {
	data: { time: string; sales: number }[];
}

export function SalesAnalysisChart({  data }: SalesAnalysisChartProps) {

	const chartData = data;

	return (
		<div className='h-[300px]'>
			<ChartContainer
				config={{}}
				className='aspect-[none] h-full'>
				<LineChart data={chartData}>
					<ChartTooltip content={<ChartTooltipContent />} />

					<CartesianGrid
						vertical={false}
						strokeDasharray='3 3'
					/>

					<XAxis
						dataKey='time'
						axisLine={false}
						tickLine={false}
					/>
					<Line
						type='monotone'
						dataKey='sales'
						stroke='hsl(var(--chart-1))'
						strokeWidth={2}
						dot={{ r: 4 }}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ChartContainer>
		</div>
	);
}
