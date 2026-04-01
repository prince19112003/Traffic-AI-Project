import './globals.css';

export const metadata = {
  title: 'TrafficGuard Ultra | AI-Powered Traffic Management System',
  description: 'Next-generation AI traffic management utilizing YOLOv8 computer vision for real-time adaptive signal control, emergency preemption, and high-accuracy vehicle detection.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
