'use client';

import { useEffect, useRef } from 'react';
import { AnnotatedMatch } from '../lib/referenceDetection';

interface AnnotatedTextDisplayProps {
    annotatedText: string;
    annotations: AnnotatedMatch[];
    className?: string;
}

export default function AnnotatedTextDisplay({
    annotatedText,
    annotations,
    className = ""
}: AnnotatedTextDisplayProps) {
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textRef.current) return;

        const handleAnnotationClick = (event: Event) => {
            const target = event.target as HTMLElement;
            const annotationRef = target.closest('.annotation-ref');

            if (annotationRef) {
                const annotationId = annotationRef.getAttribute('data-annotation-id');

                // Remove active class from all annotation refs
                textRef.current?.querySelectorAll('.annotation-ref').forEach(ref => {
                    ref.classList.remove('active');
                });

                // Remove highlighted class from all annotation items
                document.querySelectorAll('.annotation-item').forEach(item => {
                    item.classList.remove('highlighted');
                });

                // Add active class to clicked annotation ref
                annotationRef.classList.add('active');

                // Highlight corresponding annotation item
                const annotationItem = document.querySelector(`.annotation-item[data-annotation-id="${annotationId}"]`);
                if (annotationItem) {
                    annotationItem.classList.add('highlighted');
                    annotationItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        };

        const handleAnnotationItemClick = (event: Event) => {
            const target = event.target as HTMLElement;
            const annotationItem = target.closest('.annotation-item');

            if (annotationItem) {
                const annotationId = annotationItem.getAttribute('data-annotation-id');

                // Remove active/highlighted classes
                document.querySelectorAll('.annotation-ref').forEach(ref => {
                    ref.classList.remove('active');
                });
                document.querySelectorAll('.annotation-item').forEach(item => {
                    item.classList.remove('highlighted');
                });

                // Highlight clicked item
                annotationItem.classList.add('highlighted');

                // Highlight corresponding text reference
                const annotationRef = textRef.current?.querySelector(`.annotation-ref[data-annotation-id="${annotationId}"]`);
                if (annotationRef) {
                    annotationRef.classList.add('active');
                    annotationRef.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        };

        // Add event listeners
        textRef.current.addEventListener('click', handleAnnotationClick);
        document.addEventListener('click', handleAnnotationItemClick);

        return () => {
            textRef.current?.removeEventListener('click', handleAnnotationClick);
            document.removeEventListener('click', handleAnnotationItemClick);
        };
    }, []);

    return (
        <div
            ref={textRef}
            className={`prose max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: annotatedText }}
        />
    );
}