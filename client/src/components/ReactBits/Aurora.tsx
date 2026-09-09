import React from 'react';

interface AuroraProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'vibrant' | 'electric';
}

export const Aurora: React.FC<AuroraProps> = ({ children, className = '', intensity = 'vibrant' }) => {
  const opacityMap = {
    subtle: 'opacity-30',
    vibrant: 'opacity-55',
    electric: 'opacity-80',
  };

  return (
    <div className={`relative w-full min-h-screen overflow-hidden bg-[#0b021a] ${className}`}>
      {/* Dynamic Aurora Gradient Blobs */}
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden filter blur-[90px] mix-blend-screen transition-opacity duration-1000 ${opacityMap[intensity]}`}
      >
        <div
          className="aurora-blob-1 absolute -top-[20%] -left-[10%] w-[650px] h-[650px] rounded-full"
          style={{ background: 'radial-gradient(circle, #7928ca 0%, rgba(121, 40, 202, 0) 70%)' }}
        />
        <div
          className="aurora-blob-2 absolute top-[10%] -right-[15%] w-[750px] h-[750px] rounded-full"
          style={{ background: 'radial-gradient(circle, #1368ce 0%, rgba(19, 104, 206, 0) 70%)' }}
        />
        <div
          className="aurora-blob-3 absolute -bottom-[15%] left-[20%] w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, #e21b3c 0%, rgba(226, 27, 60, 0) 70%)' }}
        />
        <div
          className="aurora-blob-1 absolute top-[40%] left-[35%] w-[550px] h-[550px] rounded-full"
          style={{ background: 'radial-gradient(circle, #26890c 0%, rgba(38, 137, 12, 0) 70%)' }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Children content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
