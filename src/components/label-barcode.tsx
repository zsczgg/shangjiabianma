'use client';

import { useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';

type Props = {
  value: string;
  compact?: boolean;
  showText?: boolean;
  textSize?: number;
};

export default function LabelBarcode({ value, compact = false, showText = true, textSize }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    bwipjs.toCanvas(ref.current, {
      bcid: 'code128',
      text: value,
      scale: 3,
      height: compact ? 5.5 : 10,
      includetext: showText,
      textxalign: 'center',
      textsize: textSize ? Math.max(4, Math.round(textSize * 3)) : compact ? 7 : 9,
      paddingwidth: 1,
      paddingheight: 0,
      backgroundcolor: 'FFFFFF',
    });
  }, [compact, showText, textSize, value]);

  if (!value) return null;
  return <canvas className={compact ? 'label-barcode compact' : 'label-barcode'} ref={ref} aria-label={`Code 128：${value}`} />;
}
