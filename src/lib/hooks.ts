'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Dashboard data with 30 second cache
export function useDashboard() {
  return useSWR('/api/dashboard', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // Cache for 30 seconds
  });
}

// Notifications with 2 minute cache
export function useNotifications() {
  return useSWR('/api/notifications', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 120000, // Cache for 2 minutes
  });
}

// Reports with 1 minute cache
export function useReports(period: string) {
  return useSWR(`/api/reports?period=${period}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Cache for 1 minute
  });
}

// Search results (no cache - always fresh)
export function useSearch(query: string, type: string) {
  const shouldFetch = query.length >= 2;
  return useSWR(
    shouldFetch ? `/api/search?q=${encodeURIComponent(query)}&type=${type}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
}

// Calendar data with 1 minute cache
export function useCalendarData(year: number, month: number) {
  return useSWR(`/api/calendar?year=${year}&month=${month}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

// Leaves data
export function useLeaves() {
  return useSWR('/api/leaves', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

// Absents data
export function useAbsents() {
  return useSWR('/api/absents', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

// Projects/Works data
export function useProjects() {
  return useSWR('/api/projects', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}
