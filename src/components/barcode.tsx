'use client';import { useEffect,useRef } from 'react';import bwipjs from 'bwip-js';
export default function Barcode({value}:{value:string}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{if(ref.current)bwipjs.toCanvas(ref.current,{bcid:'code128',text:value,scale:2,height:8,includetext:true,textxalign:'center'});},[value]);return <div className="barcode-box"><canvas ref={ref}/></div>}
