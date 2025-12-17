import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

interface MDXComponentProps {
  children?: ReactNode;
  [key: string]: unknown;
}

interface ImageProps extends MDXComponentProps {
  src: string;
  alt: string;
}

interface LinkProps extends MDXComponentProps {
  href: string;
}

const MDXComponents = {
  img: ({ src, alt, ...props }: ImageProps) => (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={400}
      className="rounded-lg"
      {...props}
    />
  ),
  a: ({ href, children, ...props }: LinkProps) => (
    <Link href={href} className="text-primary hover:underline" {...props}>
      {children}
    </Link>
  ),
  h1: ({ children, ...props }: MDXComponentProps) => (
    <h1 className="text-3xl font-bold mb-4 text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: MDXComponentProps) => (
    <h2 className="text-2xl font-semibold mb-3 text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: MDXComponentProps) => (
    <h3 className="text-xl font-semibold mb-2 text-foreground" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: MDXComponentProps) => (
    <p className="mb-4 text-foreground/90 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: MDXComponentProps) => (
    <ul className="mb-4 ml-6 list-disc text-foreground/90" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: MDXComponentProps) => (
    <ol className="mb-4 ml-6 list-decimal text-foreground/90" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: MDXComponentProps) => (
    <li className="mb-2" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: MDXComponentProps) => (
    <blockquote className="border-l-4 border-primary/20 pl-4 py-2 mb-4 italic text-foreground/80" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: MDXComponentProps) => (
    <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: MDXComponentProps) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props}>
      {children}
    </pre>
  ),
};

export default MDXComponents;
