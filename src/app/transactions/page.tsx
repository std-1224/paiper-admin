'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchIcon, FilterIcon, RefreshCwIcon, CalendarIcon, ArrowUpDownIcon, CreditCardIcon, DollarSignIcon, WalletIcon, PlusCircleIcon } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { format } from "date-fns";

interface Transaction {
  id: string;
  user: string;
  userId: string;
  order: string;
  paymentMethod: string;
  date: string;
  amount: string;
  status: string;
  type: 'order' | 'balance_load';
}

export default function Transactions() {
  const { ordersData } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [balanceTransactions, setBalanceTransactions] = useState<any[]>([]);

  // Fetch balance transactions
  useEffect(() => {
    const fetchBalanceTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const data = await response.json();
          setBalanceTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching balance transactions:', error);
      }
    };

    fetchBalanceTransactions();
  }, []);

  // Transform orders data into order transactions
 const orderTransactions: Transaction[] = ordersData?.map(order => ({
      id: order.id,
      user: order.user_name || "Unknown",
      userId: order.user_id || "",
      order: order.id.toString(),
      paymentMethod: order.payment_method || "",
      date: order.created_at,
      amount: order.total_amount?.toString() || "0",
      status: order.status,
      type: 'order' as const,
    })) || [];

  // Transform balance transactions
  const balanceTransactionsList: Transaction[] = balanceTransactions?.map(transaction => ({
      id: transaction.id,
      user: transaction.user?.name || transaction.user?.email || "Unknown",
      userId: transaction.user_id || "",
      order: "Balance Load",
      paymentMethod: transaction.type === 'cash' ? 'cash' : transaction.type === 'charge' ? 'mercadopago' : transaction.type,
      date: transaction.created_at,
      amount: transaction.amount?.toString() || "0",
      status: transaction.status,
      type: 'balance_load' as const,
    })) || [];

  // Combine all transactions
  const transactions: Transaction[] = [...orderTransactions, ...balanceTransactionsList];

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sorted and filtered transactions
  const getSortedTransactions = () => {
    let filteredTransactions = transactions;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTransactions = filteredTransactions.filter(
        transaction =>
          transaction.user.toLowerCase().includes(query) ||
          transaction.order.toLowerCase().includes(query) ||
          transaction.paymentMethod.toLowerCase().includes(query) ||
          transaction.amount.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      filteredTransactions = filteredTransactions.filter(
        transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= from && transactionDate <= to;
        }
      );
    } else if (fromDate) {
      const from = new Date(fromDate);
      filteredTransactions = filteredTransactions.filter(
        transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= from;
        }
      );
    } else if (toDate) {
      const to = new Date(toDate);
      filteredTransactions = filteredTransactions.filter(
        transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate <= to;
        }
      );
    }

    // Apply sorting
    return filteredTransactions.sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case 'user':
          valueA = a.user.toLowerCase();
          valueB = b.user.toLowerCase();
          break;
        case 'order':
          valueA = a.order;
          valueB = b.order;
          break;
        case 'paymentMethod':
          valueA = a.paymentMethod;
          valueB = b.paymentMethod;
          break;
        case 'date':
          valueA = new Date(a.date);
          valueB = new Date(b.date);
          break;
        case 'amount':
          valueA = parseFloat(a.amount.replace('$', ''));
          valueB = parseFloat(b.amount.replace('$', ''));
          break;
        default:
          valueA = a[sortField as keyof Transaction];
          valueB = b[sortField as keyof Transaction];
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Get icon for payment method
  const getPaymentMethodIcon = (method: string, transactionType: string) => {
    if (transactionType === 'balance_load') {
      return <PlusCircleIcon className='h-4 w-4 mr-2 text-green-600' />;
    }

    switch (method) {
      case 'mercadopago':
        return <CreditCardIcon className='h-4 w-4 mr-2' />;
      case 'cash':
        return <DollarSignIcon className='h-4 w-4 mr-2' />;
      case 'balance':
        return <WalletIcon className='h-4 w-4 mr-2' />;
      default:
        return null;
    }
  };

  const sortedTransactions = getSortedTransactions();

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold dark:text-white'>Transaction List</h1>
          <p className='text-muted-foreground dark:text-gray-400'>History of all transactions</p>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
        <div className='relative w-full md:w-96'>
          <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search transactions...'
            className='pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-2'>
            <CalendarIcon className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm text-muted-foreground dark:text-gray-400'>From:</span>
            <Input
              type='date'
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className='border-0 p-0 h-auto w-auto dark:bg-transparent dark:text-white'
            />
          </div>

          <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-2'>
            <CalendarIcon className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm text-muted-foreground dark:text-gray-400'>To:</span>
            <Input
              type='date'
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className='border-0 p-0 h-auto w-auto dark:bg-transparent dark:text-white'
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className='bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-muted/50 dark:bg-gray-800 text-left'>
              <tr>
                <th 
                  className='p-4 font-medium text-muted-foreground dark:text-gray-400 cursor-pointer'
                  onClick={() => handleSort('user')}>
                  <div className='flex items-center'>
                    USER
                    {sortField === 'user' && <ArrowUpDownIcon className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />}
                  </div>
                </th>
                <th 
                  className='p-4 font-medium text-muted-foreground dark:text-gray-400 cursor-pointer'
                  onClick={() => handleSort('order')}>
                  <div className='flex items-center'>
                    ORDER
                    {sortField === 'order' && <ArrowUpDownIcon className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />}
                  </div>
                </th>
                <th className='p-4 font-medium text-muted-foreground dark:text-gray-400'>TYPE</th>
                <th
                  className='p-4 font-medium text-muted-foreground dark:text-gray-400 cursor-pointer'
                  onClick={() => handleSort('paymentMethod')}>
                  <div className='flex items-center'>
                    METHOD
                    {sortField === 'paymentMethod' && <ArrowUpDownIcon className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />}
                  </div>
                </th>
                <th 
                  className='p-4 font-medium text-muted-foreground dark:text-gray-400 cursor-pointer'
                  onClick={() => handleSort('date')}>
                  <div className='flex items-center'>
                    DATE
                    {sortField === 'date' && <ArrowUpDownIcon className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />}
                  </div>
                </th>
                <th 
                  className='p-4 font-medium text-muted-foreground dark:text-gray-400 cursor-pointer'
                  onClick={() => handleSort('amount')}>
                  <div className='flex items-center'>
                    AMOUNT
                    {sortField === 'amount' && <ArrowUpDownIcon className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />}
                  </div>
                </th>
                <th className='p-4 font-medium text-muted-foreground dark:text-gray-400'>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className='border-t dark:border-gray-800 hover:bg-muted/50 dark:hover:bg-gray-800/50'>
                  <td className='p-4 dark:text-white'>
                    {transaction.user}
                  </td>
                  <td className='p-4 dark:text-white'>
                    {transaction.order}
                  </td>
                  <td className='p-4 dark:text-white'>
                    <Badge
                      className={
                        transaction.type === 'balance_load'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }>
                      {transaction.type === 'balance_load' ? 'Balance Load' : 'Order'}
                    </Badge>
                  </td>
                  <td className='p-4 dark:text-white'>
                    <div className='flex items-center'>
                      {getPaymentMethodIcon(transaction.paymentMethod, transaction.type)}
                      {transaction.type === 'balance_load' ? 'Balance Load' : transaction.paymentMethod}
                    </div>
                  </td>
                  <td className='p-4 dark:text-white'>
                    {format(new Date(transaction.date), "MM/dd/yyyy HH:mm:ss")}
                  </td>
                  <td className='p-4 font-medium dark:text-white'>
                    ${transaction.amount}
                  </td>
                  <td className='p-4'>
                    <Badge
                      className={
                        transaction.status === 'delivered' || transaction.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }>
                      {transaction.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}