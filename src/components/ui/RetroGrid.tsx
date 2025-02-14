import { cn } from "../../lib/utils";
import React from 'react';
import { useWallet } from "@solana/wallet-adapter-react";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
  titlePadding?: number;
  showTitle?: boolean;
  overlayContent?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
  titlePadding = 18,
  showTitle = true,
  overlayContent,
  subtitle,
  ...props
}: RetroGridProps) {
  const { publicKey } = useWallet();
  
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
    "--title-padding": `${titlePadding * 0.25}rem`,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-start overflow-hidden bg-background" style={gridStyles}>
      {/* Title Text with Silkscreen Font */}
      {showTitle && (
        <>
          <span className="pointer-events-none z-20 font-silkscreen whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-center text-7xl font-bold leading-none tracking-tighter text-transparent" style={{ paddingTop: 'calc(var(--title-padding) + 2rem)' }}>
            FENT SPORTS
          </span>
          
          {/* Subheading */}
          <span className="pointer-events-none z-20 font-silkscreen text-white text-xl mt-4 text-center">
            {subtitle || (
              <>
                Click A Game to Play!<br />
                {publicKey ? (
                  localStorage.getItem("userName") ? (
                    <span className="text-white font-silkscreen">
                      Hello, {localStorage.getItem("userName")}!
                    </span>
                  ) : (
                    <span className="animate-blink">Loading...</span>
                  )
                ) : (
                  <span className="animate-blink">
                    Connect your wallet to climb the leaderboard!
                  </span>
                )}
              </>
            )}
          </span>
        </>
      )}

      {/* Retro Grid Background */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 w-full h-full overflow-hidden [perspective:200px]",
          `opacity-[var(--opacity)]`,
          className
        )}
      >
        <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
          <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
      </div>

      {overlayContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
