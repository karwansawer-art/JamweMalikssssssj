import React from 'react';
import type { Book } from '../../types.ts';
import { CloseIcon } from '../ui/Icons.tsx';

interface PdfViewerModalProps {
    book: Book;
    onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ book, onClose }) => {
    // Use the base fileUrl for viewing inside an iframe.
    const pdfUrl = book.fileUrl;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="w-full max-w-4xl h-[95vh] bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200 truncate">{book.title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-hidden">
                    <iframe
                        src={pdfUrl}
                        title={book.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                    ></iframe>
                </main>
            </div>
        </div>
    );
};

export default PdfViewerModal;
