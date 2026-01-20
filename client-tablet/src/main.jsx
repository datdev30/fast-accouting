import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Configure QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Retry failed requests
            retry: (failureCount, error) => {
                // Don't retry on 4xx errors (client errors)
                if (error?.response?.status >= 400 && error?.response?.status < 500) {
                    return false;
                }
                
                // Retry up to 3 times for network errors
                return failureCount < 3;
            },
            // Exponential backoff: 1s, 2s, 4s
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch when window regains focus
            refetchOnWindowFocus: true,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Stale time: consider data fresh for 30 seconds
            staleTime: 30000,
        },
        mutations: {
            // Retry mutations on network errors
            retry: (failureCount, error) => {
                // Don't retry on 4xx errors
                if (error?.response?.status >= 400 && error?.response?.status < 500) {
                    return false;
                }
                
                // Retry mutations once for network errors
                return failureCount < 1;
            },
            retryDelay: 1000,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
