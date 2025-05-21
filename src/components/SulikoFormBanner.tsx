'use client'
import { useTheme } from "next-themes";
import SulikoLogo from "./SulikoLogo"



export default function SulikoFormBanner() {
    const { theme } = useTheme();       
    return (
        <div className={`w-full py-[100px] sm:py-0 sm:w-[50%] h-full ${theme === 'dark' ? 'suliko-default-bg-dark' : 'suliko-default-bg'} flex justify-center items-center z-10`}>
        <SulikoLogo className="lg:w-[400px]" width={300} adaptive={false} defaultColor="Light" />
      </div>
    )
}