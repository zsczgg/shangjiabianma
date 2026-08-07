'use client';

import { useRef, useState } from 'react';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';

export default function ProductImageInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    const body = new FormData();
    body.set('image', file);
    try {
      const response = await fetch('/api/product-images', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '图片上传失败');
      onChange(data.imageUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '图片上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return <div className="product-image-input">
    <div className={`product-image-preview ${value ? 'has-image' : ''}`}>
      {value ? <img src={value} alt="商品图片预览" /> : <><IconPhoto/><span>暂无商品图片</span></>}
    </div>
    <div className="product-image-controls">
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void upload(event.target.files?.[0])}/>
      <button type="button" className="image-upload-button" disabled={uploading} onClick={() => inputRef.current?.click()}><IconUpload/>{uploading ? '正在上传…' : value ? '重新上传' : '上传商品图片'}</button>
      {value && <button type="button" className="image-clear-button" onClick={() => onChange('')}><IconX/>清除图片</button>}
      <small>支持 JPG、PNG、WebP，最大 5 MB。图片上传后需保存商品才会关联。</small>
      <div className="field image-url-field"><label>或者使用图片网址</label><input type="url" value={value.startsWith('/uploads/') ? '' : value} onChange={event => onChange(event.target.value)} placeholder="https://…"/></div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  </div>;
}
