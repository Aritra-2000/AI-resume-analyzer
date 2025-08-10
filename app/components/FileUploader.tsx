import {useCallback, useEffect, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import { formatSize } from '~/lib/utils';

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {

    const [file, setFile] = useState<File | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true) }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const next = acceptedFiles[0] || null;
        setFile(next);
        onFileSelect?.(next);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

     const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        multiple: false,
        accept: {'application/pdf': ['.pdf']},
        maxSize: maxFileSize,
        disabled: !mounted,
        noKeyboard: !mounted,
        noClick: false,
        noDrag: false,
    })



    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />

                <div className="space-y-4 cursor-pointer">
                    {file ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <img src="/images/pdf.png" alt="pdf" className="size-10" />
                            <div className="flex items-center space-x-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                className='p-2 cursor-pointer'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                    onFileSelect?.(null);
                                }}
                                type='button'
                            >
                                <img src='/icons/cross.svg' alt='remove' className='h-4 w-4'/>
                            </button>
                        </div>
                    ): (
                        <div>
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="upload" className="size-20" />
                            </div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">
                                    Click to upload
                                </span> or drag and drop
                            </p>
                            <p className="text-lg text-gray-500">PDF (max {formatSize(maxFileSize)})</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default FileUploader
