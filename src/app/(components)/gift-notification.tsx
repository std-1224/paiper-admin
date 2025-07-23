'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GiftIcon, CheckIcon, XIcon, QrCodeIcon } from 'lucide-react';

interface GiftNotificationProps {
	gift?: {
		id: string;
		sender?: {
			name: string;
			avatar: string;
		};
		recipient?: {
			name: string;
			avatar?: string;
			table?: string;
		};
		drink: {
			name: string;
			image: string;
			category: string;
		};
		message?: string;
		timestamp: string;
		status: 'pending' | 'redeemed' | 'expired';
	};
	onClose?: () => void;
}

export function GiftNotification({ gift, onClose }: GiftNotificationProps) {
	const [showQR, setShowQR] = useState(false);

	// If no gift is provided, use a default one for demo purposes
	// const defaultGift = {
	// 	id: 'GIFT-1234',
	// 	sender: {
	// 		name: 'Carlos Ruiz',
	// 		avatar: 'https://github.com/yusufhilmi.png',
	// 	},
	// 	drink: {
	// 		name: 'Champagne Dom Perignon',
	// 		image: 'https://images.unsplash.com/photo-1592483648228-b35146a4330c?q=80&w=100&auto=format&fit=crop',
	// 		category: 'Champagne',
	// 	},
	// 	message: '¡Disfruta de esta botella! Celebremos juntos esta noche.',
	// 	timestamp: 'Hace 2 minutos',
	// 	status: 'pending',
	// };

	const giftData = gift;

	const handleRedeemGift = () => {
		setShowQR(true);
	};

	const getStatusBadge = () => {
		switch (gift?.status) {
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

	return (
		<Sheet
			defaultOpen
			onOpenChange={onClose}>
			<SheetContent
				side='right'
				className='sm:max-w-md dark:bg-gray-900 dark:border-gray-800'>
				<SheetHeader className='text-left'>
					<SheetTitle className='flex items-center text-xl dark:text-white'>
						<GiftIcon className='h-5 w-5 mr-2 text-purple-500' />
						¡Has recibido un regalo!
					</SheetTitle>
					<SheetDescription className='dark:text-gray-400'>Alguien te ha enviado una bebida. Muestra el código QR en la barra para canjearla.</SheetDescription>
				</SheetHeader>

				{!showQR ? (
					<div className='py-6 space-y-6'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-3'>
								<Avatar>
									<AvatarImage
										src={gift?.sender?.avatar}
										alt={gift?.sender?.name}
									/>

									<AvatarFallback>{gift?.sender?.name.charAt(0)}</AvatarFallback>
								</Avatar>
								<div>
									<p className='font-medium dark:text-white'>{gift?.sender?.name}</p>
									<p className='text-sm text-muted-foreground dark:text-gray-400'>{gift?.timestamp}</p>
								</div>
							</div>
							{getStatusBadge()}
						</div>

						<div className='bg-muted/30 p-4 rounded-lg dark:bg-gray-800/30'>
							<div className='flex items-start space-x-4'>
								<div className='h-16 w-16 rounded-md overflow-hidden'>
									<img
										src={gift?.drink.image}
										alt={gift?.drink.name}
										className='h-full w-full object-cover'
									/>
								</div>
								<div className='flex-1'>
									<h3 className='font-medium dark:text-white'>{gift?.drink.name}</h3>
									<Badge
										variant='outline'
										className='mt-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
										{gift?.drink.category}
									</Badge>
								</div>
							</div>

							{gift?.message && <div className='mt-4 p-3 bg-background dark:bg-gray-900 rounded-md text-sm italic'>"{gift?.message}"</div>}
						</div>

						<div className='space-y-2 text-center'>
							<p className='text-sm text-muted-foreground dark:text-gray-400'>ID del regalo: {gift?.id}</p>
							<p className='text-sm text-muted-foreground dark:text-gray-400'>Para canjear tu regalo, haz clic en el botón de abajo y muestra el código QR al bartender.</p>
						</div>
					</div>
				) : (
					<div className='py-6 space-y-6 text-center'>
						<div className='bg-white p-4 rounded-lg mx-auto max-w-[250px]'>
							<div className='relative'>
								<img
									src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GIFT-1234'
									alt='QR Code'
									className='w-full h-auto'
								/>

								<div className='absolute inset-0 flex items-center justify-center opacity-20'>
									<GiftIcon className='h-20 w-20 text-purple-500' />
								</div>
							</div>
						</div>

						<div>
							<h3 className='font-bold text-lg dark:text-white'>{gift?.drink.name}</h3>
							<p className='text-sm text-muted-foreground dark:text-gray-400 mt-1'>ID: {gift?.id}</p>
						</div>

						<div className='bg-muted/30 p-4 rounded-lg dark:bg-gray-800/30 text-left'>
							<p className='text-sm font-medium dark:text-white mb-2'>Instrucciones:</p>
							<ol className='text-sm text-muted-foreground dark:text-gray-400 space-y-2 list-decimal pl-4'>
								<li>Muestra este código QR al bartender</li>
								<li>El bartender escaneará el código para validar tu regalo</li>
								<li>Recibe tu bebida y ¡disfruta!</li>
							</ol>
						</div>
					</div>
				)}

				<SheetFooter className='flex flex-col gap-2 sm:flex-row mt-6'>
					{!showQR ? (
						<>
							<SheetClose asChild>
								<Button
									variant='outline'
									className='dark:border-gray-700 dark:text-gray-300'>
									Cerrar
								</Button>
							</SheetClose>
							<Button
								onClick={handleRedeemGift}
								className='bg-purple-600 hover:bg-purple-700'>
								<QrCodeIcon className='h-4 w-4 mr-2' />
								Mostrar código QR
							</Button>
						</>
					) : (
						<>
							<Button
								variant='outline'
								onClick={() => setShowQR(false)}
								className='dark:border-gray-700 dark:text-gray-300'>
								Volver
							</Button>
							<SheetClose asChild>
								<Button className='bg-purple-600 hover:bg-purple-700'>Cerrar</Button>
							</SheetClose>
						</>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
