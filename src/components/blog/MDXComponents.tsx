import Image from 'next/image';
import Link from 'next/link';

const MDXComponents = {
  img: ({ src, alt, ...props }: any) => (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={400}
      className="rounded-lg"
      {...props}
    />
  ),
  a: ({ href, children, ...props }: any) => (
    <Link href={href} className="text-primary hover:underline" {...props}>
      {children}
    </Link>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl font-bold mb-4 text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl font-semibold mb-3 text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl font-semibold mb-2 text-foreground" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-4 text-foreground/90 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="mb-4 ml-6 list-disc text-foreground/90" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="mb-4 ml-6 list-decimal text-foreground/90" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="mb-2" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary/20 pl-4 py-2 mb-4 italic text-foreground/80" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: any) => (
    <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props}>
      {children}
    </pre>
  ),
};

export default MDXComponents;
