import { addCollection, type IconifyJSON } from '@iconify/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/roboto-mono'
import iconData from '@/constants/icon-data.json'
import '@/styles/global.css'
import { router } from '@/router'

const iconCollections = iconData as unknown as IconifyJSON[]
iconCollections.forEach((collection) => addCollection(collection))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  window.addEventListener('unhandledrejection', (event) => {
    if (String(event.reason?.message).startsWith('Failed to update a ServiceWorker')) event.preventDefault()
  })

  const { startMocks } = await import('@/mocks/browser')
  await startMocks()
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
