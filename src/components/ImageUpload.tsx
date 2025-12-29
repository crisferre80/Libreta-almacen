import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string | null;
  bucket: string;
  path: string;
  label: string;
}

export default function ImageUpload({ onUpload, currentImage, bucket, path, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const removeImage = async () => {
    if (currentImage) {
      // Extraer el path del URL para eliminar del storage
      const url = new URL(currentImage);
      const filePath = url.pathname.split('/').slice(-2).join('/');
      await supabase.storage.from(bucket).remove([filePath]);
      onUpload('');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {currentImage ? (
        <div className="relative">
          <img src={currentImage} alt={label} className="w-32 h-32 object-cover rounded-lg border" />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {uploading ? 'Subiendo...' : 'Arrastra una imagen aquí o haz clic para seleccionar'}
          </p>
        </div>
      )}
    </div>
  );
}