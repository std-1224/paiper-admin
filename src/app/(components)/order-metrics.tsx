'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCartIcon, ClockIcon, CheckIcon, ArchiveIcon, X } from 'lucide-react';
import { MetricData } from '@/types/types';

export function OrderMetrics({ data }: { data: MetricData[] }) {
	const getIcon = (iconName: string, color: string) => {
		const iconClass = `h-6 w-6 text-${color}-500`;

		switch (iconName) {
			case 'shopping-cart':
				return <ShoppingCartIcon className={iconClass} />;
			case 'clock':
				return <ClockIcon className={iconClass} />;
			case 'check':
				return <CheckIcon className={iconClass} />;
			case 'archive':
				return <ArchiveIcon className={iconClass} />;
			case 'x':
				return <X  className={iconClass} />;
			default:
				return <ShoppingCartIcon className={iconClass} />;
		}
	};

	const getBgColor = (color: string) => {
		return `bg-${color}-100 dark:bg-${color}-900/20`;
	};

	return (
		<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
			{data.map((metric, index) => (
				<Card
					key={metric.id}
					id={`ydq8b3_${index}`}>
					<CardContent
						className='p-6 flex items-center justify-between'
						id={`3sdr2w_${index}`}>
						<div id={`qakd35_${index}`}>
							<p
								className='text-sm text-muted-foreground'
								id={`802vew_${index}`}>
								{metric.title}
							</p>
							<h3
								className='text-2xl font-bold'
								id={`zh67z8_${index}`}>
								{metric.value}
							</h3>
						</div>
						<div
							className={`p-3 rounded-full ${getBgColor(metric.color)}`}
							id={`8hkuo2_${index}`}>
							{getIcon(metric.icon, metric.color)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
