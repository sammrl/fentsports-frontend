// src/components/ThreeDCarousel.tsx
import React from "react";
import { Carousel } from "react-responsive-3d-carousel";
import "react-responsive-3d-carousel/dist/styles.css";

// Custom styles to hide dots and index and fix image sizing
const hideDotsAndIndexStyle = `
  .react-3d-carousel .dots-wrapper,
  .react-3d-carousel .dots-wrapper *,
  .react-3d-carousel .slider-container .slider-number,
  .react-3d-carousel .slider-single .slider-number {
    display: none !important;
  }

  /* Remove all effects and fix sizing */
  .react-3d-carousel .slider-single {
    height: auto !important;
    background: none !important;
    box-shadow: none !important;
    pointer-events: auto !important;
  }

  .react-3d-carousel .slider-single-content {
    box-shadow: none !important;
    background: none !important;
    padding: 0 !important;
    height: auto !important;
    pointer-events: auto !important;
  }

  .react-3d-carousel .slider-container {
    background: transparent !important;
  }

  .react-3d-carousel .slider-single.preactive,
  .react-3d-carousel .slider-single.proactive {
    box-shadow: none !important;
  }

  .react-3d-carousel .slider-single-content > div {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    transform: translateZ(0);
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 0 40px rgba(255, 41, 117, 0.2);
    pointer-events: auto !important;
    z-index: 10 !important;
  }

  .react-3d-carousel .slider-single-content > div::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 18px;
    padding: 3px;
    background: linear-gradient(45deg, #ff2975, #8c1eff);
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: 1;
  }

  .react-3d-carousel img {
    width: 100% !important;
    height: auto !important;
    object-fit: contain !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    box-shadow: none !important;
    background: none !important;
    transform: scale(1);
    transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .react-3d-carousel .slider-single:hover .slider-single-content > div {
    box-shadow: 0 0 60px rgba(255, 41, 117, 0.4);
    transform: translateY(-10px);
  }

  .react-3d-carousel .slider-single:hover img {
    transform: scale(1.05);
  }

  /* Add subtle reflection effect */
  .react-3d-carousel .slider-single-content > div::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 50%
    );
    transform: rotate(30deg);
    pointer-events: none;
  }

  .react-3d-carousel .slider-single-content {
    width: 600px !important;  // Half of 1200px for better fit
    height: 400px !important; // Half of 800px for better fit
    margin: 0 auto;
  }

  .react-3d-carousel .slider-single {
    width: 600px !important;
    height: 400px !important;
  }

  .react-3d-carousel img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border-radius: 20px;
  }

  // Keep your existing styles but update the container
  .react-3d-carousel .slider-container {
    padding: 0 !important;
    width: 100% !important;
    height: 500px !important; // Give extra space for 3D effect
  }
`;

interface CarouselItem {
  key: string;
  image: string;
}

interface ThreeDCarouselProps {
  onItemClick: (gameKey: string) => void;
}

export function ThreeDCarousel({ onItemClick }: ThreeDCarouselProps) {
  // Define your carousel items with consistent game names
  const carouselItems: CarouselItem[] = [
    { key: "FentMan", image: "/images/image1.png" },
    { key: "FentFall", image: "/images/image2.png" },
    { key: "FentaPiller", image: "/images/image3.png" },
  ];

  // Map over the items to create clickable carousel slides
  const items = carouselItems.map((item) => (
    <div
      key={item.key}
      onClick={() => {
        console.log('Card clicked:', item.key);
        onItemClick(item.key);
      }}
      className="cursor-pointer h-full"
      style={{ 
        background: 'none', 
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      <img
        className="w-full h-full object-cover"
        src={item.image}
        alt={`Game ${item.key}`}
        style={{ 
          display: 'block',
          margin: 0,
          padding: 0,
          boxShadow: 'none'
        }}
      />
    </div>
  ));

  return (
    <div 
      className="fixed inset-0 flex justify-center items-center mt-16 bg-transparent z-30 pointer-events-auto"
      style={{ 
        pointerEvents: 'auto',
        height: '600px' // Adjust container height to accommodate the carousel
      }}
    >
      <style>{hideDotsAndIndexStyle}</style>
      {items.length > 0 ? (
        <Carousel 
          items={items} 
          startIndex={0} 
          arrowColor="rgba(255, 255, 255, 0.6)"
        />
      ) : (
        <p className="text-white text-center">No items to display.</p>
      )}
    </div>
  );
}
