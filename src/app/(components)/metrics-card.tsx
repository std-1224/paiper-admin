'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSignIcon, ClockIcon, UsersIcon, CheckIcon, ClipboardIcon } from 'lucide-react';

interface MetricsCardProps {
	data: {
		id: string;
		title: string;
		value: string;
		change?: string;
		subtext?: string;
		icon: string;
		iconColor: string;
		iconBg: string;
	};
}

export function MetricsCard({ data }: MetricsCardProps) {
	const getIcon = () => {
		switch (data.icon) {
			case 'dollar':
				return <DollarSignIcon className={`h-6 w-6 ${data.iconColor}`} />;

			case 'clock':
				return <ClockIcon className={`h-6 w-6 ${data.iconColor}`} />;

			case 'users':
				return <UsersIcon className={`h-6 w-6 ${data.iconColor}`} />;

			case 'check':
				return <CheckIcon className={`h-6 w-6 ${data.iconColor}`} />;

			case 'clipboard':
				return <ClipboardIcon className={`h-6 w-6 ${data.iconColor}`} />;

			default:
				return <DollarSignIcon className={`h-6 w-6 ${data.iconColor}`} />;
		}
	};

	return (
		<Card className='dark:bg-gray-900 dark:border-gray-800 '>
			<CardContent className='p-6'>
				<div className='flex items-center justify-between'>
					<div className='space-y-1'>
						<p className='text-sm text-muted-foreground dark:text-gray-400'>{data.title}</p>
						<div className='flex items-baseline'>
							<h3 className='text-2xl font-bold dark:text-white'>{data.value}</h3>
							{data.change && <span className={`ml-2 text-xs ${data.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{data.change}</span>}
						</div>
						{data.subtext && <p className='text-xs text-muted-foreground dark:text-gray-400'>{data.subtext}</p>}
					</div>
					<div className={`p-3 rounded-full ${data.iconBg}`}>{getIcon()}</div>
				</div>
			</CardContent>
		</Card>
	);
}
