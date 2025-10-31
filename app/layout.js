export const metadata = {
  title: 'Contentstack-like Site',
  description: 'Static site served via Next rewrites',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


