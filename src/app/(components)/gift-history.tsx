'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GiftIcon, QrCodeIcon, ClockIcon, CheckIcon, XIcon } from 'lucide-react';
import { GiftNotification } from '(components)/gift-notification';
import { gifts } from '@/types/types';

interface GiftHistoryProps {
	isOpen: boolean;
	onClose: () => void;
}

export function GiftHistory({ isOpen, onClose }: GiftHistoryProps) {
	const [activeTab, setActiveTab] = useState('received');
	const [selectedGift, setSelectedGift] = useState<gifts>();
	const [showGiftDetail, setShowGiftDetail] = useState(false);

	// Mock data for received gifts
	const receivedGifts: gifts[] = [
		{
			id: 'GIFT-1234',
			sender: {
				name: 'Carlos Ruiz',
				avatar: 'https://github.com/yusufhilmi.png',
			},
			drink: {
				name: 'Champagne Dom Perignon',
				image: 'https://images.unsplash.com/photo-1592483648228-b35146a4330c?q=80&w=100&auto=format&fit=crop',
				category: 'Champagne',
			},
			message: '¡Disfruta de esta botella! Celebremos juntos esta noche.',
			timestamp: 'Hace 2 minutos',
			status: 'pending' as const,
		},
		{
			id: 'GIFT-1233',
			sender: {
				name: 'Ana Martinez',
				avatar: 'https://github.com/furkanksl.png',
			},
			drink: {
				name: 'Martini',
				image: 'https://images.unsplash.com/photo-1575023782549-62ca0d244b39?q=80&w=100&auto=format&fit=crop',
				category: 'Cocktail',
			},
			message: 'Para la mejor amiga. ¡Salud!',
			timestamp: 'Hace 30 minutos',
			status: 'redeemed' as const,
		},
		{
			id: 'GIFT-1232',
			sender: {
				name: 'Miguel Sánchez',
				avatar: 'https://github.com/polymet-ai.png',
			},
			drink: {
				name: 'Whisky Johnnie Walker Blue Label',
				image: 'https://images.unsplash.com/photo-1527281400683-1aefee6bca6e?q=80&w=100&auto=format&fit=crop',
				category: 'Whisky',
			},
			timestamp: 'Ayer',
			status: 'redeemed' as const,
			message: 'Un pequeño detalle para agradecerte por tu ayuda.',
		},
	];

	// Mock data for sent gifts
	const sentGifts: gifts[] = [
		{
			id: 'GIFT-1231',
			recipient: {
				name: 'Laura Gomez',
				avatar: 'https://github.com/furkanksl.png',
			},
			drink: {
				name: 'Mojito',
				image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=100&auto=format&fit=crop',
				category: 'Cocktail',
			},
			message: 'Un pequeño detalle para agradecerte por tu ayuda.',
			timestamp: 'Hace 1 hora',
			status: 'pending' as const,
		},
		{
			id: 'GIFT-1230',
			recipient: {
				name: 'Javier Rodriguez',
				avatar: 'https://github.com/yusufhilmi.png',
			},
			drink: {
				name: 'Tequila Don Julio 1942',
				image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=100&auto=format&fit=crop',
				category: 'Tequila',
			},
			timestamp: 'Hace 3 horas',
			status: 'redeemed' as const,
			message: 'ojala tengan una buena noche',
		},
		{
			id: 'GIFT-1229',
			recipient: {
				name: 'VIP 8',
				table: 'VIP 8',
			},
			drink: {
				name: 'Vodka Grey Goose',
				image: 'https://images.unsplash.com/photo-1608885898957-a07e10e20336?q=80&w=100&auto=format&fit=crop',
				category: 'Vodka',
			},
			message: 'Para toda la mesa. ¡Disfruten!',
			timestamp: 'Ayer',
			status: 'redeemed' as const,
		},
	];

	const handleGiftClick = (gift: gifts) => {
		setSelectedGift(gift);
		setShowGiftDetail(true);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'pending':
				return <Badge className='bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'>Pendiente</Badge>;

			case 'redeemed':
				return <Badge className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>Canjeado</Badge>;

			case 'expired':
				return <Badge className='bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'>Expirado</Badge>;

			default:
				return null;
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'pending':
				return <ClockIcon className='h-4 w-4 text-blue-500' />;
			case 'redeemed':
				return <CheckIcon className='h-4 w-4 text-green-500' />;
			case 'expired':
				return <XIcon className='h-4 w-4 text-red-500' />;
			default:
				return null;
		}
	};

	return (
		<>
			<Dialog
				open={isOpen && !showGiftDetail}
				onOpenChange={onClose}>
				<DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800'>
					<DialogHeader>
						<DialogTitle className='flex items-center text-xl dark:text-white'>
							<GiftIcon className='h-5 w-5 mr-2 text-purple-500' />
							Historial de Regalos
						</DialogTitle>
						<DialogDescription className='dark:text-gray-400'>Visualiza los regalos que has enviado y recibido</DialogDescription>
					</DialogHeader>

					<Tabs
						defaultValue='received'
						value={activeTab}
						onValueChange={setActiveTab}
						className='w-full mt-4'>
						<TabsList className='grid w-full grid-cols-2 dark:bg-gray-800'>
							<TabsTrigger
								value='received'
								className='dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300'>
								Recibidos
							</TabsTrigger>
							<TabsTrigger
								value='sent'
								className='dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300'>
								Enviados
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value='received'
							className='space-y-4 mt-4'>
							{receivedGifts.length > 0 ? (
								<div className='space-y-3'>
									{receivedGifts.map((gift, index) => (
										<div
											key={gift.id}
											className='flex items-start p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors'
											onClick={() => handleGiftClick(gift)}
											id={`rvf6m9_${index}`}>
											<div
												className='h-12 w-12 rounded-md overflow-hidden mr-3'
												id={`pbl4r9_${index}`}>
												<img
													src={gift.drink.image}
													alt={gift.drink.name}
													className='h-full w-full object-cover'
													id={`q8tgmh_${index}`}
												/>
											</div>
											<div
												className='flex-1'
												id={`kw2t1y_${index}`}>
												<div
													className='flex justify-between items-start'
													id={`txot31_${index}`}>
													<div id={`cpwqk5_${index}`}>
														<p
															className='font-medium dark:text-white'
															id={`2y97u6_${index}`}>
															{gift.drink.name}
														</p>
														<div
															className='flex items-center mt-1'
															id={`r5w3xa_${index}`}>
															{gift.sender && (
																<>
																	<Avatar
																		className='h-5 w-5 mr-1'
																		id={`yuigl0_${index}`}>
																		<AvatarImage
																			src={gift.sender.avatar}
																			alt={gift.sender.name}
																			id={`4w5ap0_${index}`}
																		/>
																		<AvatarFallback id={`ezroy1_${index}`}>{gift.sender.name.charAt(0)}</AvatarFallback>
																	</Avatar>
																	<p
																		className='text-sm text-muted-foreground dark:text-gray-400'
																		id={`8jzwhz_${index}`}>
																		De: {gift.sender.name}
																	</p>
																</>
															)}
														</div>
													</div>
													<div
														className='flex flex-col items-end'
														id={`sqm991_${index}`}>
														{getStatusBadge(gift.status)}
														<p
															className='text-xs text-muted-foreground dark:text-gray-400 mt-1'
															id={`ztd3wt_${index}`}>
															{gift.timestamp}
														</p>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className='text-center py-8'>
									<GiftIcon className='h-12 w-12 mx-auto text-muted-foreground dark:text-gray-500 mb-2' />
									<p className='text-muted-foreground dark:text-gray-400'>No has recibido ningún regalo aún</p>
								</div>
							)}
						</TabsContent>

						<TabsContent
							value='sent'
							className='space-y-4 mt-4'>
							{sentGifts.length > 0 ? (
								<div className='space-y-3'>
									{sentGifts.map((gift, index) => (
										<div
											key={gift.id}
											className='flex items-start p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors'
											onClick={() => handleGiftClick(gift)}
											id={`bi4r33_${index}`}>
											<div
												className='h-12 w-12 rounded-md overflow-hidden mr-3'
												id={`rutmxo_${index}`}>
												<img
													src={gift.drink.image}
													alt={gift.drink.name}
													className='h-full w-full object-cover'
													id={`jueb2q_${index}`}
												/>
											</div>
											<div
												className='flex-1'
												id={`xoa7k3_${index}`}>
												<div
													className='flex justify-between items-start'
													id={`8k2xt0_${index}`}>
													<div id={`jod7b4_${index}`}>
														<p
															className='font-medium dark:text-white'
															id={`6uyhah_${index}`}>
															{gift.drink.name}
														</p>
														<div
															className='flex items-center mt-1'
															id={`ong481_${index}`}>
															{gift.recipient && (
																<>
																	<Avatar
																		className='h-5 w-5 mr-1'
																		id={`mfwlql_${index}`}>
																		{gift.recipient.avatar && (
																			<AvatarImage
																				src={gift.recipient.avatar}
																				alt={gift.recipient.name}
																				id={`najimy_${index}`}
																			/>
																		)}
																		<AvatarFallback id={`rrxu8n_${index}`}>{gift.recipient.name.charAt(0)}</AvatarFallback>
																	</Avatar>
																	<p
																		className='text-sm text-muted-foreground dark:text-gray-400'
																		id={`gpk5c1_${index}`}>
																		Para: {gift.recipient.name}
																	</p>
																</>
															)}
														</div>
													</div>
													<div
														className='flex flex-col items-end'
														id={`zkm8o0_${index}`}>
														{getStatusBadge(gift.status)}
														<p
															className='text-xs text-muted-foreground dark:text-gray-400 mt-1'
															id={`u2c8yq_${index}`}>
															{gift.timestamp}
														</p>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className='text-center py-8'>
									<GiftIcon className='h-12 w-12 mx-auto text-muted-foreground dark:text-gray-500 mb-2' />
									<p className='text-muted-foreground dark:text-gray-400'>No has enviado ningún regalo aún</p>
								</div>
							)}
						</TabsContent>
					</Tabs>

					<DialogFooter className='mt-6'>
						<Button
							onClick={onClose}
							className='w-full sm:w-auto'>
							Cerrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{showGiftDetail && selectedGift && (
				<GiftNotification
					gift={selectedGift}
					onClose={() => {
						setShowGiftDetail(false);
						setSelectedGift(undefined);
					}}
				/>
			)}
		</>
	);
}
