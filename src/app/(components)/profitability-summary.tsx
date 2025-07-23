'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { LineChart, Line, XAxis, CartesianGrid, YAxis, Tooltip } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSignIcon, TrendingUpIcon, EyeIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAppContext } from '@/context/AppContext';

interface ProfitabilitySummaryProps {
	onViewDetails: () => void;
}

// Define types for our data structure
interface ChartDataItem {
	name: string;
	revenue: number;
	costs: number;
	profit: number;
}

interface ProfitabilityDataItem {
	totalRevenue: number;
	totalCosts: number;
	totalProfit: number;
	profitMargin: number;
	chartData: ChartDataItem[];
}

interface ProfitabilityData {
	today: ProfitabilityDataItem;
	week: ProfitabilityDataItem;
	month: ProfitabilityDataItem;
}

export function ProfitabilitySummary({ onViewDetails }: ProfitabilitySummaryProps) {
	const [timeFilter, setTimeFilter] = useState('today');
	const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData>({
		today: {
			totalRevenue: 0,
			totalCosts: 0,
			totalProfit: 0,
			profitMargin: 0,
			chartData: [],
		},
		week: {
			totalRevenue: 0,
			totalCosts: 0,
			totalProfit: 0,
			profitMargin: 0,
			chartData: [],
		},
		month: {
			totalRevenue: 0,
			totalCosts: 0,
			totalProfit: 0,
			profitMargin: 0,
			chartData: [],
		},
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const {ordersData} = useAppContext();

	useEffect(() => {
		const fetchProfitabilityData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Get date ranges
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);

				const weekStart = new Date(today);
				weekStart.setDate(weekStart.getDate() - weekStart.getDay());
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekEnd.getDate() + 7);

				const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
				const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

				// Fetch today's orders
				const todayOrders = ordersData.filter(order => order.created_at >= today.toISOString() && order.created_at < tomorrow.toISOString());

				// Fetch week's orders
				const weekOrders = ordersData.filter(order => order.created_at >= weekStart.toISOString() && order.created_at < weekEnd.toISOString());

				const monthOrders = ordersData.filter(order => order.created_at >= monthStart.toISOString() && order.created_at < monthEnd.toISOString());

				// Process today's data
				const todayData = processOrdersData(todayOrders, 'hour');

				// Process week's data
				const weekData = processOrdersData(weekOrders, 'day');

				// Process month's data
				const monthData = processOrdersData(monthOrders, 'week');
				setProfitabilityData({
					today: todayData,
					week: weekData,
					month: monthData,
				});
			} catch (err) {
				console.error('Error fetching profitability data:', err);
				setError('Error loading profitability data');
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfitabilityData();
	}, [ordersData]);

	// Helper function to process orders data
	const processOrdersData = (orders: any[], groupBy: 'hour' | 'day' | 'week'): ProfitabilityDataItem => {
		if (!orders || orders.length === 0) {
			return {
				totalRevenue: 0,
				totalCosts: 0,
				totalProfit: 0,
				profitMargin: 0,
				chartData: [],
			};
		}

		// Calculate total revenue and costs
		let totalRevenue = 0;
		let totalCosts = 0;
		const chartDataMap = new Map<string, ChartDataItem>();

		orders.forEach((order) => {
			// Add to total revenue
			totalRevenue += order.total_amount || 0;

			// Calculate costs from order items
			let orderCosts = 0;
			if (order.order_items && order.order_items.length > 0) {
				order.order_items.forEach((item: any) => {
					// Assuming each item has a cost field, if not you'll need to fetch product costs
					orderCosts += (item.quantity || 0) * (item.unit_price || 0);
				});
			}
			totalCosts += orderCosts;

			// Group data for chart
			const date = new Date(order.created_at);
			let key = '';

			if (groupBy === 'hour') {
				key = `${date.getHours()}:00`;
			} else if (groupBy === 'day') {
				const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
				key = days[date.getDay()];
			} else if (groupBy === 'week') {
				const weekNumber = Math.floor(date.getDate() / 7) + 1;
				key = `Sem ${weekNumber}`;
			}

			if (chartDataMap.has(key)) {
				const existing = chartDataMap.get(key)!;
				existing.revenue += order.total_amount || 0;
				existing.costs += orderCosts;
				existing.profit = existing.revenue - existing.costs;
				chartDataMap.set(key, existing);
			} else {
				chartDataMap.set(key, {
					name: key,
					revenue: order.total_amount || 0,
					costs: orderCosts,
					profit: (order.total_amount || 0) - orderCosts,
				});
			}
		});

		// Convert map to array and sort
		const chartData = Array.from(chartDataMap.values()).sort((a, b) => {
			if (groupBy === 'hour') {
				return parseInt(a.name.split(':')[0]) - parseInt(b.name.split(':')[0]);
			} else if (groupBy === 'day') {
				const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
				return days.indexOf(a.name) - days.indexOf(b.name);
			} else {
				return parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]);
			}
		});

		const totalProfit = totalRevenue - totalCosts;
		const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

		return {
			totalRevenue,
			totalCosts,
			totalProfit,
			profitMargin: Math.round(profitMargin),
			chartData,
		};
	};

	const currentData = profitabilityData[timeFilter as keyof typeof profitabilityData];

	return (
		<Card className='mb-6 dark:bg-gray-900 dark:border-gray-800'>
			<CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0 dark:border-gray-800'>
				<CardTitle className='text-xl font-bold flex items-center dark:text-white'>
					<TrendingUpIcon className='h-5 w-5 mr-2 text-green-600 dark:text-green-400' />
					Resumen de Rentabilidad
				</CardTitle>
				<Select
					value={timeFilter}
					onValueChange={setTimeFilter}>
					<SelectTrigger className='w-[180px] dark:border-gray-700 dark:text-gray-300'>
						<SelectValue placeholder='Seleccionar período' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='today'>Hoy</SelectItem>
						<SelectItem value='week'>Esta semana</SelectItem>
						<SelectItem value='month'>Este mes</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className='animate-pulse space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
							<div className='h-24 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
							<div className='h-24 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
							<div className='h-24 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
						</div>
						<div className='h-[200px] bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
					</div>
				) : error ? (
					<div className='text-red-500 dark:text-red-400 p-4 text-center'>{error}</div>
				) : (
					<>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
							<div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Total Recaudado</p>
								<p className='text-2xl font-bold text-green-600 dark:text-green-400'>${currentData.totalRevenue.toFixed(2)}</p>
							</div>
							<div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Total Costos</p>
								<p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>${currentData.totalCosts.toFixed(2)}</p>
							</div>
							<div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Margen de Ganancia</p>
								<p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
									${currentData.totalProfit.toFixed(2)} <span className='text-sm font-normal'>({currentData.profitMargin}%)</span>
								</p>
							</div>
						</div>

						<div className='h-[200px] mt-4'>
							<ChartContainer
								config={{}}
								className='aspect-[none] h-full'>
								<LineChart data={currentData.chartData}>
									<ChartTooltip content={<ChartTooltipContent />} />

									<CartesianGrid
										vertical={false}
										strokeDasharray='3 3'
										stroke='var(--border)'
									/>
									<XAxis
										dataKey='name'
										axisLine={false}
										tickLine={false}
										tick={{ fill: 'var(--foreground)' }}
									/>
									<YAxis
										axisLine={false}
										tickLine={false}
										tick={{ fill: 'var(--foreground)' }}
									/>

									<Line
										type='monotone'
										dataKey='profit'
										name='Ganancia'
										stroke='hsl(var(--primary))'
										strokeWidth={2}
										dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
										activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
									/>
								</LineChart>
							</ChartContainer>
						</div>

						<div className='flex justify-end mt-4'>
							<Button
								onClick={onViewDetails}
								variant='outline'
								className='flex items-center dark:border-gray-700 dark:text-gray-300'>
								<EyeIcon className='h-4 w-4 mr-2' />
								Ver Detalles
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
