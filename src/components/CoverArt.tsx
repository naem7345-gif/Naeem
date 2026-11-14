import React, { useState, useEffect } from 'react';
import { DEFAULT_COVER_SVG } from '../services/musicApi';

interface CoverArtProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

export const CoverArt: React.FC<CoverArtProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc || DEFAULT_COVER_SVG);

  useEffect(() => {
    setImgSrc(src || fallbackSrc || DEFAULT_COVER_SVG);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else if (imgSrc !== DEFAULT_COVER_SVG) {
      setImgSrc(DEFAULT_COVER_SVG);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      loading="lazy"
      className={className}
    />
  );
};
