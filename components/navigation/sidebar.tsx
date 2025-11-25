'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, LayoutTemplate, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Bulletins', href: '/dashboard/bulletins', icon: FileText },
    { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6 py-6 border-b">
                    <h1 className="text-2xl font-bold text-blue-600">BulletinFlow</h1>
                </div>
                <div className="mt-6 flex-grow flex flex-col">
                    <nav className="flex-1 px-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                        isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'mr-3 flex-shrink-0 h-5 w-5',
                                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                        )}
                                    />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </div>
    )
}
