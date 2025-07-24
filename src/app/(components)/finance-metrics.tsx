'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUpIcon, CheckIcon, AlertTriangleIcon, WalletIcon, PlusCircleIcon } from 'lucide-react';

interface FinanceMetricProps {
	id: string;
	title: string;
	value: string;
	change: string;
	icon: string;
	color: string;
}

export function FinanceMetrics({ data }: { data: FinanceMetricProps[] }) {
	const getIcon = (iconName: string, color: string) => {
		const iconClass = `h-6 w-6 text-${color}-500`;

		switch (iconName) {
			case 'chart-line':
				return <TrendingUpIcon className={iconClass} />;
			case 'check':
				return <CheckIcon className={iconClass} />;
			case 'alert':
				return <AlertTriangleIcon className={iconClass} />;
			case 'wallet':
				return <WalletIcon className={iconClass} />;
			case 'plus-circle':
				return <PlusCircleIcon className={iconClass} />;
			default:
				return <TrendingUpIcon className={iconClass} />;
		}
	};

	const getBgColor = (color: string) => {
		return `bg-${color}-100 dark:bg-${color}-900/20`;
	};

	const getTextColor = (color: string) => {
		return `text-${color}-500`;
	};

	return (
		<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
			{data.map((metric, index) => (
				<Card
					key={metric.id}
					id={`metric-card-${index}`}>
					<CardContent
						className='p-6 flex flex-col'
						id={`metric-content-${index}`}>
						<div
							className='flex items-center justify-between mb-4'
							id={`metric-header-${index}`}>
							<h3
								className='text-base font-medium'
								id={`metric-title-${index}`}>
								{metric.title}
							</h3>
							<div
								className={`p-3 rounded-full ${getBgColor(metric.color)}`}
								id={`metric-icon-bg-${index}`}>
								{getIcon(metric.icon, metric.color)}
							</div>
						</div>
						<div id={`metric-values-${index}`}>
							<p
								className='text-2xl font-bold'
								id={`metric-value-${index}`}>
								{metric.value}
							</p>
							<p
								className={`text-sm ${getTextColor('green')}`}
								id={`metric-change-${index}`}>
								{metric.change}
							</p>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
