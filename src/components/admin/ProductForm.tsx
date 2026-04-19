'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { IProduct } from '@/types';

interface ProductFormProps {
  product?: IProduct;
  mode: 'create' | 'edit';
}

const categories = [
  { value: 'whole-spices', label: 'Whole Spices' },
  { value: 'ground-spices', label: 'Ground Spices' },
  { value: 'blended-masala', label: 'Blended Masala' },
  { value: 'herbs', label: 'Herbs' },
  { value: 'seasoning', label: 'Seasoning' },
  { value: 'organic', label: 'Organic' },
  { value: 'premium', label: 'Premium' },
  { value: 'combo-packs', label: 'Combo Packs' },
];

export default function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    mrp: product?.mrp?.toString() || '',
    stock: product?.stock?.toString() || '0',
    category: product?.category || 'whole-spices',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateDescription = async () => {
    if (!formData.name.trim()) {
      setError('Enter a product name first to generate a description');
      return;
    }
    setGeneratingDesc(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, category: formData.category }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, description: data.description }));
      } else {
        setError(data.error || 'Failed to generate description');
      }
    } catch {
      setError('AI service unavailable');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = 5 - imagePreviews.length;

    if (remaining <= 0) {
      setError('Maximum 5 images allowed');
      return;
    }

    const toUpload = fileArray.slice(0, remaining);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

    for (const file of toUpload) {
      if (!allowed.includes(file.type)) {
        setError(`Invalid type: ${file.name}. Use JPEG, PNG, WebP, AVIF, or GIF.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 5MB limit`);
        return;
      }
    }

    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      toUpload.forEach((f) => fd.append('images', f));

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        setImagePreviews((prev) => [...prev, ...data.data.paths]);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed — network error');
    } finally {
      setUploading(false);
    }
  }, [imagePreviews.length]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= imagePreviews.length) return;
    setImagePreviews((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const discount = formData.mrp && formData.price
    ? Math.round(((parseFloat(formData.mrp) - parseFloat(formData.price)) / parseFloat(formData.mrp)) * 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const priceVal = parseFloat(formData.price);
    const mrpVal = parseFloat(formData.mrp) || 0;

    if (mrpVal > 0 && mrpVal < priceVal) {
      setError('MRP cannot be less than selling price');
      setLoading(false);
      return;
    }

    try {
      const url = mode === 'create' ? '/api/products' : `/api/products/${product?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: priceVal,
          mrp: mrpVal,
          stock: parseInt(formData.stock),
          images: imagePreviews,
          image: imagePreviews[0] || '/images/default-product.jpg',
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
      <h2 className="text-2xl font-bold text-amber-900 mb-6">
        {mode === 'create' ? '✨ Add New Product' : '✏️ Edit Product'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Image Upload Zone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Images <span className="text-gray-400 font-normal">({imagePreviews.length}/5)</span>
          </label>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-amber-500 bg-amber-50 scale-[1.02] shadow-lg shadow-amber-100'
                : imagePreviews.length >= 5
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-amber-700 font-medium">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">{dragActive ? '📂' : '📸'}</div>
                <p className="font-medium text-gray-700">
                  {dragActive ? 'Drop images here!' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  or click to browse • JPEG, PNG, WebP • Max 5MB each
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              onChange={handleFileSelect}
              disabled={imagePreviews.length >= 5}
              className="hidden"
            />
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {imagePreviews.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                    i === 0 ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
                  }`}
                >
                  <div className="aspect-square relative bg-gray-100">
                    <Image
                      src={src}
                      alt={`Product image ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </div>

                  {i === 0 && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                      MAIN
                    </div>
                  )}

                  {/* Hover controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveImage(i, i - 1); }}
                        className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm hover:bg-amber-100"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                    {i < imagePreviews.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveImage(i, i + 1); }}
                        className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm hover:bg-amber-100"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
            placeholder="e.g., Garam Masala Premium"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={generatingDesc}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 font-medium"
            >
              {generatingDesc ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>✨ Generate with AI</>
              )}
            </button>
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
            placeholder="Describe the product, or click ✨ Generate with AI above..."
          />
        </div>

        {/* Price + MRP row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              MRP (₹) <span className="text-gray-400 font-normal">optional</span>
            </label>
            <input
              name="mrp"
              type="number"
              step="0.01"
              min="0"
              value={formData.mrp}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
              placeholder="0"
            />
          </div>
        </div>

        {/* Discount preview */}
        {discount > 0 && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <span className="text-2xl">🏷️</span>
            <div>
              <span className="text-sm text-gray-500">Customer sees: </span>
              <span className="text-gray-400 line-through text-sm">₹{formData.mrp}</span>
              <span className="text-lg font-bold text-amber-700 ml-2">₹{formData.price}</span>
              <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full">
                {discount}% OFF
              </span>
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white py-3.5 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-lg shadow-amber-200"
          >
            {loading ? 'Saving...' : mode === 'create' ? '🚀 Add Product' : '💾 Update Product'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
