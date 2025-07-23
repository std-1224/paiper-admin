'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardIcon, DollarSignIcon, UsersIcon } from 'lucide-react';

interface DailySummaryProps {
	data: {
		id: string;
		title: string;
		value: string;
		change: string;
		icon: string;
	}[];
}

export function DailySummary({ data }: DailySummaryProps) {
	const getIcon = (iconName: string) => {
		switch (iconName) {
			case 'clipboard':
				return <ClipboardIcon className='h-5 w-5 dark:text-gray-300' />;

			case 'dollar':
				return <DollarSignIcon className='h-5 w-5 dark:text-gray-300' />;

			case 'users':
				return <UsersIcon className='h-5 w-5 dark:text-gray-300' />;
			default:
				return <ClipboardIcon className='h-5 w-5 dark:text-gray-300' />;
		}
	};

	return (
		<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
			{data.map((item, index) => (
				<Card
					key={item.id}
					className='dark:bg-gray-900 dark:border-gray-800'
					id={`j43oua_${index}`}>
					<CardContent
						className='p-4 flex items-center justify-between'
						id={`kn9pxk_${index}`}>
						<div id={`8mwd2x_${index}`}>
							<p
								className='text-sm text-muted-foreground dark:text-gray-400'
								id={`gvx2s3_${index}`}>
								{item.title}
							</p>
							<h3
								className='text-2xl font-bold dark:text-white'
								id={`q3kr7b_${index}`}>
								{item.value}
							</h3>
						</div>
						<div
							className='flex flex-col items-end'
							id={`u4gh78_${index}`}>
							<div
								className='p-2 rounded-full bg-primary/10 dark:bg-primary/5'
								id={`vyh1zn_${index}`}>
								{getIcon(item.icon)}
							</div>
							<span
								className={`text-xs mt-1 ${item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
								id={`73fql2_${index}`}>
								{item.change}
							</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
