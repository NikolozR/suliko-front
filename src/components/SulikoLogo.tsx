"use client";
import Image from "next/image";
import SulikoLogoWhite from "../../public/suliko_logo_white.svg";
import SulikoLogoBlack from "../../public/Suliko_logo_black.svg";
import { useTheme } from "next-themes";

interface SulikoLogoProps {
  width?: number;
  height?: number;
  className?: string;
  adaptive?: boolean;
  defaultColor?: "Dark" | "Light";
}

export default function SulikoLogo({
  width = 120,
  height = 30,
  className,
  adaptive = true,
  defaultColor = "Dark",
}: SulikoLogoProps) {
  const { theme } = useTheme();
  return (
    adaptive ? (
      <Image
        src={theme === "dark" ? SulikoLogoWhite : SulikoLogoBlack}
        width={width}
        height={height}
        alt="Suliko Logo"
        className={className}
      />
    ) : (
      <Image
        src={defaultColor === "Dark" ? SulikoLogoBlack : SulikoLogoWhite}
        width={width}
        height={height}
        alt="Suliko Logo"
        className={className}
      />
    )
  );
}
