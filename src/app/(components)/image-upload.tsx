import { useState, useEffect } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ImageUpload({ 
  handleSetImageFile, // Changed from handleSetImageUrl
  imageUrl 
}: { 
  handleSetImageFile: (file: File | null) => void, // Now accepts File object
  imageUrl?: string 
}) {
    const [images, setImages] = useState<ImageListType>([]);
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const maxNumber = 1;

    // Initialize with existing image URL
    useEffect(() => {
        if (imageUrl) {
            setDisplayUrl(imageUrl);
        }
    }, [imageUrl]);

    const onChange = (imageList: ImageListType) => {
        setImages(imageList);
        // Pass the file to parent component immediately when selected
        if (imageList.length > 0) {
            handleSetImageFile(imageList[0].file || null);
        } else {
            handleSetImageFile(null);
        }
    };

    return (
        <div className="space-y-4">
            <ImageUploading
                value={images}
                onChange={onChange}
                maxNumber={maxNumber}
                acceptType={["jpg", "jpeg", "png"]}
            >
                {({
                    imageList,
                    onImageUpload,
                    onImageRemoveAll,
                    onImageUpdate,
                    onImageRemove,
                    isDragging,
                    dragProps,
                }) => (
                    <div className="space-y-4">
                        {/* Upload Area */}
                        <div className="flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={onImageUpload}
                                {...dragProps}
                                className={`flex-1 min-w-[200px] p-4 border-2 border-dashed rounded-lg transition-all ${
                                    isDragging
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                }`}
                            >
                                <div className="flex flex-col items-center justify-center gap-2 text-center">
                                    <UploadIcon className="w-6 h-6 text-gray-500" />
                                    <span className="font-medium text-gray-700">
                                        {isDragging ? "Drop image here" : "Click or drag image"}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        JPG, PNG (max 5MB)
                                    </span>
                                </div>
                            </button>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {imageList.length > 0 && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            onImageRemoveAll();
                                            handleSetImageFile(null);
                                        }}
                                    >
                                        <Trash2Icon className="w-4 h-4 mr-2" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="mt-4 space-y-4">
                            {imageList.length > 0 && (
                                <div className="relative group overflow-hidden rounded-lg border border-gray-200">
                                    <img
                                        src={imageList[0].dataURL}
                                        alt="Preview"
                                        className="w-full h-auto max-h-64 object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => onImageUpdate(0)}
                                            className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                                            title="Update"
                                        >
                                            <RefreshCwIcon className="w-4 h-4 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                onImageRemove(0);
                                                handleSetImageFile(null);
                                            }}
                                            className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2Icon className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 truncate">
                                        {imageList[0].file?.name}
                                    </p>
                                </div>
                            )}

                            {displayUrl && !imageList.length && (
                                <div className="relative group">
                                    <img
                                        src={displayUrl}
                                        alt="Uploaded content"
                                        className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200"
                                    />
                                    <p className="mt-2 text-sm text-gray-600">
                                        Uploaded image
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ImageUploading>
        </div>
    );
}