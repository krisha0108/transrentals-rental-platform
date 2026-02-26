import { Lora, Playfair_Display } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-blog-body',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-blog-heading',
  display: 'swap',
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${lora.variable} ${playfair.variable}`}>
      {children}
    </div>
  );
}
