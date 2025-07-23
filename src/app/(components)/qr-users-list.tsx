'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { QrOrder } from '@/types/types';

interface QrUsersListProps {
	onUserClick: (user_id: string) => void;
	qrOrders: QrOrder[];
	id?: string;
}

export function QrUsersList({ onUserClick, qrOrders, id }: QrUsersListProps) {

	const users = Object.values(
		qrOrders.reduce((acc: Record<string, any>, item) => {
			if (!item?.user_id) return acc;
		  if (!acc[item?.user_id]) {
			acc[item?.user_id] = {
			  id: item?.user_id,
			  total_amount: 0,
			  user: item?.user,
			  count: 0
			};
		  }
		  acc[item?.user_id].total_amount += Number(item?.total_amount);
		  acc[item?.user_id].count += 1;
		  return acc;
		}, {})
	  );
	  
	// get top users accoding to total amount
	const topUsers = users.sort((a, b) => b.total_amount - a.total_amount).slice(0, 5);
	const maxOrders = Math.max(...topUsers.map((user) => user.count));

	return (
		<div
			className='h-full overflow-y-auto'
			id={id || 'qr-users-list-container'}>
			<div className='space-y-4'>
				{topUsers.map((user, index) => (
					<div
						key={user.id}
						className='flex items-center space-x-4 p-3 rounded-lg border dark:border-gray-800 hover:bg-muted/50 dark:hover:bg-gray-800/50 cursor-pointer'
						onClick={() => onUserClick(user.id)}
						id={`top-user-${user.id}`}>
						<div
							className='font-medium w-6 text-center text-muted-foreground dark:text-gray-400'
							id={`top-user-rank-${user.id}`}>
							#{index + 1}
						</div>
						<Avatar
							className='h-10 w-10'
							id={`top-user-avatar-${user.id}`}>
							<AvatarImage
								src={user.user.avatar}
								alt={user.user.name}
								id={`top-user-avatar-img-${user.id}`}
							/>

							<AvatarFallback id={`top-user-avatar-fallback-${user.id}`}>{user?.user?.name?.charAt(0)}</AvatarFallback>
						</Avatar>
						<div
							className='flex-1'
							id={`top-user-info-${user.id}`}>
							<div
								className='flex justify-between items-start'
								id={`top-user-header-${user.id}`}>
								<div id={`top-user-details-${user.id}`}>
									<p
										className='font-medium dark:text-white'
										id={`top-user-name-${user.id}`}>
										{user.user.name}
									</p>
									<p
										className='text-xs text-muted-foreground dark:text-gray-400'
										id={`top-user-email-${user.id}`}>
										{user.user.email}
									</p>
								</div>
								<div
									className='text-right'
									id={`top-user-stats-${user.id}`}>
									<p
										className='font-medium dark:text-white'
										id={`top-user-spent-${user.id}`}>
										{user.total_amount}
									</p>
									<p
										className='text-xs text-muted-foreground dark:text-gray-400'
										id={`top-user-orders-${user.id}`}>
										{user.count} pedidos
									</p>
								</div>
							</div>
							<div
								className='mt-2'
								id={`top-user-progress-container-${user.id}`}>
								<Progress
									value={(user.orders / maxOrders) * 100}
									className='h-2'
									id={`top-user-progress-${user.id}`}
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
