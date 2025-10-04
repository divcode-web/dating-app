'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Menu, X, Sun, Moon, Heart, MessageCircle, Settings, User, Home, Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-provider'

interface NavigationProps {
  showBackButton?: boolean
  title?: string
}

export function Navigation({ showBackButton = false, title }: NavigationProps) {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Don't show navigation if user is not logged in
  if (!user) {
    return null
  }

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleBack = () => {
    router.back()
  }

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'Home', path: '/' }]

    if (paths.length > 0) {
      paths.forEach((path, index) => {
        const fullPath = '/' + paths.slice(0, index + 1).join('/')
        const name = path.charAt(0).toUpperCase() + path.slice(1)
        breadcrumbs.push({ name, path: fullPath })
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left side - Back button and breadcrumbs */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center">
                  {index > 0 && <ChevronLeft className="h-3 w-3 mx-1" />}
                  <Link
                    href={crumb.path}
                    className={`hover:text-foreground transition-colors ${
                      index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''
                    }`}
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </div>

            {/* Title for mobile */}
            {title && (
              <div className="md:hidden">
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2 hover:bg-accent"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-accent"
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/home" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/swipe" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Swipe</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/matches" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Matches</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/likes" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Likes</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/messages" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-4 py-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/home" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/swipe" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Swipe</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/matches" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Matches</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/likes" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Likes</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/messages" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}