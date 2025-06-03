'use client'
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import SulikoLogo from "./SulikoLogo"

export default function SulikoFormBanner() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show default during SSR and initial client render to prevent hydration mismatch
    const backgroundClass = mounted && resolvedTheme === 'dark' 
        ? 'suliko-default-bg-dark' 
        : 'suliko-default-bg';
        
    return (
        <div className={`w-full py-[100px] sm:py-0 sm:w-[50%] h-full ${backgroundClass} flex justify-center items-center z-10`}>
            <SulikoLogo className="lg:w-[400px]" width={300} adaptive={false} defaultColor="Light" />
        </div>
    )
}