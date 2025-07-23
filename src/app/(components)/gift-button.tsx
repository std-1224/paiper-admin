'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GiftIcon } from 'lucide-react';
import { GiftService } from '(components)/gift-service';

export function GiftButton() {
	const [isGiftServiceOpen, setIsGiftServiceOpen] = useState(false);

	return (
		<>
			{/* Button removed as requested */}
			<GiftService
				isOpen={isGiftServiceOpen}
				onClose={() => setIsGiftServiceOpen(false)}
			/>
		</>
	);
}
