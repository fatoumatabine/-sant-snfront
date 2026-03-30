import React from 'react';

interface MarketingSectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export const MarketingSectionHeading: React.FC<MarketingSectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  centered = true,
}) => {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BC1A8]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-bold font-display text-[#005461] md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-slate-500 md:text-lg">{description}</p>
      )}
    </div>
  );
};

