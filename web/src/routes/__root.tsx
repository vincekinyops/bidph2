import { HeadContent, Scripts, createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { AuthProvider } from '../lib/auth'
import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');if(stored==='auto'){stored='light';window.localStorage.setItem('theme','light')}var mode=(stored==='light'||stored==='dark')?stored:'light';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(mode);root.setAttribute('data-theme',mode);root.style.colorScheme=mode;if(window.location.pathname==='/'||window.location.pathname===''){root.classList.add('landing-route')}}catch(e){}})();`

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'BidPH — Philippine Auctions' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-amber-200/60 selection:text-slate-900" suppressHydrationWarning>
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const isLanding = useRouterState({ select: (s) => s.location.pathname === '/' })

  useEffect(() => {
    document.documentElement.classList.toggle('landing-route', isLanding)
    return () => document.documentElement.classList.remove('landing-route')
  }, [isLanding])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isLanding ? (
          <Outlet />
        ) : (
          <div className="app-shell">
            <Header />
            <div className="app-shell__main">
              <Outlet />
            </div>
            <Footer />
          </div>
        )}
      </AuthProvider>
    </QueryClientProvider>
  )
}
