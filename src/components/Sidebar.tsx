"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sun, MessageSquareWarning, Stethoscope, History, LayoutDashboard, Bot, TrendingUp, LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';


export function Sidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const navItems = [
        { href: '/dashboard', labelKey: 'sidebar.dashboard', defaultLabel: 'Dashboard', icon: LayoutDashboard },
        { href: '/weather', labelKey: 'sidebar.weather', defaultLabel: 'Weather Forecast', icon: Sun },
        { href: '/advisory', labelKey: 'sidebar.advisory', defaultLabel: 'Advisory Alerts', icon: MessageSquareWarning },
        { href: '/diagnosis', labelKey: 'sidebar.diagnosis', defaultLabel: 'Crop Diagnosis', icon: Stethoscope },
        { href: '/market-prices', labelKey: 'sidebar.market', defaultLabel: 'Market Prices', icon: TrendingUp },
        { href: '/chat', labelKey: 'sidebar.chat', defaultLabel: 'Chat Assistant', icon: Bot, adminOnly: true },
        { href: '/history', labelKey: 'sidebar.history', defaultLabel: 'SMS History', icon: History },
        { href: '/help', labelKey: 'sidebar.help', defaultLabel: 'Help Center', icon: LifeBuoy },
    ];
    
    const isFarmerPortal = pathname.startsWith('/farmer');

    const filteredNavItems = isFarmerPortal 
        ? navItems.filter(item => !item.adminOnly).map(item => ({...item, href: item.href === '/dashboard' ? '/farmer' : `/farmer${item.href}`}))
        : navItems.map(item => ({...item, href: item.href}));
    
    const finalNavItems = filteredNavItems.map(item => {
        if(isFarmerPortal && item.href === '/farmer/dashboard') {
            return {...item, href: '/farmer'};
        }
        return item;
    });

    if (!isMounted) {
        return (
            <aside className="w-64 border-r p-4 hidden md:block bg-card sticky top-16 h-[calc(100vh-4rem)]">
                <div className="flex flex-col space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-64 border-r p-4 hidden md:block bg-card sticky top-16 h-[calc(100vh-4rem)]">
          <nav className="flex flex-col space-y-2">
            {finalNavItems.map((item) => (
                <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-left transition-colors duration-200 ease-in-out h-auto",
                        (pathname === item.href) && "bg-primary/10 text-primary font-semibold"
                    )}
                >
                    <Link href={item.href} className="flex items-center py-2">
                        <item.icon className="mr-2 h-5 w-5 flex-shrink-0" />
                        <span className="whitespace-normal break-words">{t(item.labelKey, item.defaultLabel)}</span>
                    </Link>
                </Button>
            ))}
          </nav>
        </aside>
    );
}
